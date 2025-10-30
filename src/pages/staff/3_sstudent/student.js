import { useState, useEffect, useRef } from "react";
import axios from "../../../api/axiosConfig";
import SinfodeAdminLayout from "../../../layouts/StaffLayout";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUser,
  FaIdCard,
  FaCalendarAlt,
  FaVenusMars,
  FaSchool,
  FaBook,
  FaClock,
  FaFilter,
  FaBuilding,
  FaUsers
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

export default function Allstudents() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBranchName, setSelectedBranchName] = useState("All Branches");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [userBranchId, setUserBranchId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });
  const navigate = useNavigate();

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        openMenuId !== null &&
        !event.target.closest(".menu-container") &&
        !event.target.closest(".menu-toggle")
      ) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  // Get user info from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserRole(user.role);
      setUserBranchId(user.branch_id);
      // For staff, set the selected branch to their branch
      if (user.role === "staff") {
        setSelectedBranch(user.branch_id.toString());
        // Find branch name
        fetchBranches().then(() => {
          const userBranch = branches.find(b => b.id === user.branch_id);
          if (userBranch) {
            setSelectedBranchName(userBranch.branch_name);
          }
        });
      }
    }
  }, []);

  // Fetch Branches
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/branches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  // Fetch Students based on user role
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      let url = "/students/show";
      
      // If staff user, filter by their branch
      if (user?.role === "staff" && user?.branch_id) {
        url = `/students/show?branch_id=${user.branch_id}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const studentsData = res.data || [];
      setStudents(studentsData);
      
      // Calculate statistics
      calculateStats(studentsData);
      
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (studentsData) => {
    const total = studentsData.length;
    const active = studentsData.filter(s => s.enrollment_status === 'Active').length;
    const completed = studentsData.filter(s => s.enrollment_status === 'Completed').length;
    
    setStats({ total, active, completed });
  };

  useEffect(() => {
    fetchBranches();
    fetchStudents();
  }, []);

  // Fetch students when branch filter changes (for admin)
  useEffect(() => {
    if (userRole === "admin" && selectedBranch) {
      fetchStudentsByBranch(selectedBranch);
    } else if (userRole === "admin" && selectedBranch === "") {
      fetchStudents(); // Fetch all students
    }
  }, [selectedBranch, userRole]);

  // Fetch students by specific branch
  const fetchStudentsByBranch = async (branchId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/students/show?branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const studentsData = res.data || [];
      setStudents(studentsData);
      calculateStats(studentsData);
      
      // Update selected branch name
      const branch = branches.find(b => b.id === parseInt(branchId));
      if (branch) {
        setSelectedBranchName(branch.branch_name);
      }
    } catch (error) {
      console.error("Error fetching students by branch:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single student data
  const fetchStudent = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/students/show/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedStudent(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching student:", error);
      alert("Failed to fetch student details");
    }
  };

  // Handle branch change
  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranch(branchId);
    
    if (branchId === "") {
      setSelectedBranchName("All Branches");
      fetchStudents();
    } else {
      const branch = branches.find(b => b.id === parseInt(branchId));
      if (branch) {
        setSelectedBranchName(branch.branch_name);
      }
    }
  };

  // Filter students by branch + search
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.admission_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.guardian_name || "").toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  // Get branch statistics
  const getBranchStats = () => {
    if (selectedBranch === "") {
      return stats;
    }
    
    const branchStudents = students.filter(s => s.branch_id === parseInt(selectedBranch));
    const total = branchStudents.length;
    const active = branchStudents.filter(s => s.enrollment_status === 'Active').length;
    const completed = branchStudents.filter(s => s.enrollment_status === 'Completed').length;
    
    return { total, active, completed };
  };

  const currentStats = getBranchStats();

  return (
    <SinfodeAdminLayout>
    <div className="px-5 py-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-nunito">
            Students Management
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedBranchName} • Total Students: <span className="font-semibold text-blue-600">{currentStats.total}</span>
          </p>
        </div>

        {/* Branch Dropdown - only show for admin */}
        {userRole === "admin" && (
          <div className="w-full lg:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaBuilding className="inline mr-2" />
              Filter by Branch
            </label>
            <select
              value={selectedBranch}
              onChange={handleBranchChange}
              className="w-full lg:w-64 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name} - {branch.city}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl border">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "list"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-transparent text-gray-600 hover:bg-gray-200"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "card"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-transparent text-gray-600 hover:bg-gray-200"
            }`}
          >
            Card View
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold mt-2">{currentStats.total}</p>
            </div>
            <div className="bg-blue-400 rounded-full p-3">
              <FaUsers className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 text-blue-100 text-sm">
            {selectedBranchName}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Students</p>
              <p className="text-3xl font-bold mt-2">{currentStats.active}</p>
            </div>
            <div className="bg-green-400 rounded-full p-3">
              <FaUser className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 text-green-100 text-sm">
            Currently enrolled
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold mt-2">{currentStats.completed}</p>
            </div>
            <div className="bg-purple-400 rounded-full p-3">
              <FaSchool className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 text-purple-100 text-sm">
            Course completed
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, admission number, or guardian..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Guardian</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Branch & Admission</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                            src={student.photo_url || "/default-avatar.png"}
                            alt={student.full_name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <FaEnvelope className="w-3 h-3" />
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{student.guardian_name || "N/A"}</div>
                      <div className="text-sm text-gray-500">Guardian</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <FaPhone className="w-3 h-3" />
                        {student.contact_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900">#{student.admission_number}</div>
                      <div className="text-sm text-gray-500">{student.branch?.branch_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.enrollment_status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : student.enrollment_status === 'Completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.enrollment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                          className="menu-toggle p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <HiDotsVertical size={20} className="text-gray-600" />
                        </button>

                        {openMenuId === student.id && (
                          <div
                            className="menu-container absolute right-0 mt-2 bg-white shadow-lg rounded-lg w-48 py-2 z-50 border border-gray-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => fetchStudent(student.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-blue-600 text-sm font-medium transition-colors"
                            >
                              <FaEye size={14} /> View Details
                            </button>
                           
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredStudents.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👨‍🎓</div>
              <div className="text-gray-400 text-lg">No students found</div>
              <div className="text-gray-500 text-sm mt-2">
                {search ? 'Try adjusting your search criteria' : `No students available in ${selectedBranchName}`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card View */}
      {!loading && viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group"
            >
              <div className="relative">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <div className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative -mt-12 mb-4">
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden">
                        <img
                          src={student.photo_url || "/default-avatar.png"}
                          alt={student.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{student.full_name}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                      <FaEnvelope className="w-3 h-3" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    
                    <div className="w-full space-y-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium">Admission No:</span>
                          <span className="text-gray-800 font-bold">#{student.admission_number}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium">Branch:</span>
                          <span className="text-gray-800">{student.branch?.branch_name}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium">Guardian:</span>
                          <span className="text-gray-800">{student.guardian_name || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        student.enrollment_status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : student.enrollment_status === 'Completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.enrollment_status}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <FaPhone className="w-3 h-3 mr-1" />
                        {student.contact_number}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => fetchStudent(student.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <FaEye size={14} />
                      View Details
                    </button>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <HiDotsVertical size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
                <p className="text-gray-600 mt-1">
                  {selectedStudent.branch?.branch_name} • #{selectedStudent.admission_number}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile & Basic Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 text-center">
                    <div className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg overflow-hidden mb-4">
                      <img
                        src={selectedStudent.photo_url || "/default-avatar.png"}
                        alt={selectedStudent.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedStudent.full_name}</h3>
                    <p className="text-gray-600 mb-4 flex items-center justify-center gap-2">
                      <FaEnvelope className="w-4 h-4" />
                      {selectedStudent.email}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Status</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedStudent.enrollment_status === 'Active' 
                              ? 'bg-green-100 text-green-800'
                              : selectedStudent.enrollment_status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedStudent.enrollment_status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Branch</span>
                          <span className="text-sm font-medium text-gray-800">{selectedStudent.branch?.branch_name}</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Contact</span>
                          <span className="text-sm font-medium text-gray-800">{selectedStudent.contact_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaUser className="text-blue-600" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <FaIdCard className="w-4 h-4" />
                            Admission Number
                          </div>
                          <div className="font-semibold text-gray-800">{selectedStudent.admission_number}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <FaCalendarAlt className="w-4 h-4" />
                            Admission Date
                          </div>
                          <div className="font-semibold text-gray-800">{selectedStudent.admission_date}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <FaCalendarAlt className="w-4 h-4" />
                            Date of Birth
                          </div>
                          <div className="font-semibold text-gray-800">{selectedStudent.dob}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <FaVenusMars className="w-4 h-4" />
                            Gender
                          </div>
                          <div className="font-semibold text-gray-800">{selectedStudent.gender}</div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaPhone className="text-green-600" />
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <FaPhone className="w-4 h-4" />
                            Phone Number
                          </div>
                          <div className="font-semibold text-gray-800">{selectedStudent.contact_number}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <FaMapMarkerAlt className="w-4 h-4" />
                            Address
                          </div>
                          <div className="font-semibold text-gray-800">{selectedStudent.address || "Not provided"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian Information */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaUser className="text-purple-600" />
                        Guardian Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-500 mb-1">Guardian Name</div>
                          <div className="font-semibold text-gray-800">{selectedStudent.guardian_name}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="text-sm text-gray-500 mb-1">Guardian Contact</div>
                          <div className="font-semibold text-gray-800">{selectedStudent.guardian_contact}</div>
                        </div>
                      </div>
                    </div>

                    {/* Course Information */}
                    {selectedStudent.courses && selectedStudent.courses.length > 0 && (
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <FaBook className="text-orange-600" />
                          Enrolled Courses ({selectedStudent.courses.length})
                        </h3>
                        <div className="space-y-4">
                          {selectedStudent.courses.map((course, index) => (
                            <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-800">{course.course_name}</h4>
                                  <p className="text-sm text-gray-600">{course.course_code} • {course.course_level}</p>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {course.mode}
                                </span>
                              </div>
                              
                              {course.batch && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <FaSchool className="w-4 h-4 text-gray-400" />
                                    <span>Batch: {course.batch.batch_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FaClock className="w-4 h-4 text-gray-400" />
                                    <span>Time: {course.batch.batch_start_time} - {course.batch.batch_end_time}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-2xl p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setEditFormData(selectedStudent);
                  setShowEditModal(true);
                  setShowModal(false);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </SinfodeAdminLayout>
  );
}