import { useState, useEffect, useRef } from "react";
import axios from "../../../api/axiosConfig";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaIdCard,
  FaVenusMars,
  FaMapMarkerAlt,
  FaBook,
  FaUsers,
  FaBuilding,
  FaClock
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

export default function Allstudents() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [userBranchId, setUserBranchId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    gender: "all",
    enrollment_status: "all",
    batch: "all",
    course: "all",
    dateRange: {
      start: "",
      end: ""
    }
  });

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
      if (user.role === "branch_manager") {
        setSelectedBranch(user.branch_id.toString());
      }
    }
  }, []);

  // Fetch Students
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/students/show", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // Fetch master data
  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [branchesRes, batchesRes, coursesRes] = await Promise.all([
        axios.get("/branches", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/batches", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/courses", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBranches(branchesRes.data || []);
      setBatches(batchesRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchMasterData();
  }, []);

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
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleDateRangeChange = (rangeType, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [rangeType]: value
      }
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      gender: "all",
      enrollment_status: "all",
      batch: "all",
      course: "all",
      dateRange: { start: "", end: "" }
    });
    setSearch("");
    setSelectedBranch("");
  };

  // Get unique values for filters
  const uniqueGenders = [...new Set(students.map(student => student.gender).filter(Boolean))];
  const uniqueEnrollmentStatuses = [...new Set(students.map(student => student.enrollment_status).filter(Boolean))];
  const uniqueBatches = [...new Set(students.flatMap(student => 
    student.courses?.map(course => course.batch?.batch_name) || []
  ).filter(Boolean))];
  const uniqueCourses = [...new Set(students.flatMap(student => 
    student.courses?.map(course => course.course_name) || []
  ).filter(Boolean))];

  // Process students with filtering
  const processedStudents = students.filter((student) => {
    const matchesSearch = search === "" || 
      (student.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.admission_number || "").toLowerCase().includes(search.toLowerCase());

    const matchesBranch = userRole === "admin" 
      ? selectedBranch === "" || student.branch_id === parseInt(selectedBranch)
      : true;

    const matchesGender = filters.gender === "all" || student.gender === filters.gender;
    const matchesEnrollment = filters.enrollment_status === "all" || student.enrollment_status === filters.enrollment_status;

    const matchesCourse = filters.course === "all" || 
      student.courses?.some(course => course.course_name === filters.course);

    const matchesBatch = filters.batch === "all" || 
      student.courses?.some(course => course.batch?.batch_name === filters.batch);

    const admissionDate = new Date(student.admission_date);
    const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
    const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
    const matchesDateRange = (!startDate || admissionDate >= startDate) && (!endDate || admissionDate <= endDate);

    return matchesSearch && matchesBranch && matchesGender && matchesEnrollment && matchesCourse && matchesBatch && matchesDateRange;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  // Get course badges for a student
  const getCourseBadges = (student) => {
    if (!student.courses || student.courses.length === 0) {
      return [<span key="none" className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">No Courses</span>];
    }
    
    return student.courses.slice(0, 2).map((course, index) => (
      <span 
        key={course.id} 
        className={`px-2 py-1 rounded text-xs font-medium ${
          index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}
      >
        {course.course_name}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students Management</h1>
          <p className="text-gray-600">Manage and track all student information</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-white border border-gray-300 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              Grid View
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, email, or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 p-2 pl-10 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Branch Dropdown - only for admin */}
          {userRole === "admin" && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg w-full md:w-60 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'bg-blue-700 text-white border border-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            <FaFilter /> Filters
            {Object.values(filters).some(filter =>
              typeof filter === 'string' ? filter !== 'all' : Object.values(filter).some(Boolean)
            ) && (
              <span className="bg-red-500 text-white rounded-full w-2 h-2"></span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Genders</option>
                  {uniqueGenders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.enrollment_status}
                  onChange={(e) => handleFilterChange('enrollment_status', e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  {uniqueEnrollmentStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select
                  value={filters.batch}
                  onChange={(e) => handleFilterChange('batch', e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Batches</option>
                  {uniqueBatches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  value={filters.course}
                  onChange={(e) => handleFilterChange('course', e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Courses</option>
                  {uniqueCourses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing <span className="font-medium text-gray-800">{processedStudents.length}</span> of{" "}
        <span className="font-medium text-gray-800">{students.length}</span> students
      </div>

      {/* Stats Cards - SAP Fiori Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{students.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {students.filter(s => s.enrollment_status === 'Active').length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <FaUser className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {students.reduce((acc, student) => acc + (student.courses?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <FaBook className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {students.filter(student => {
                  const admissionDate = new Date(student.admission_date);
                  const now = new Date();
                  return admissionDate.getMonth() === now.getMonth() && admissionDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-full">
              <FaCalendarAlt className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {processedStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group"
            >
              {/* Header with Image and Basic Info */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <img
                    src={student.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={student.full_name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {student.full_name}
                    </h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <FaEnvelope className="text-gray-400" />
                      <span className="truncate">{student.email}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.enrollment_status === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {student.enrollment_status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        student.gender === 'Male' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {student.gender}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Information */}
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FaBook className="text-gray-400" />
                    Enrolled Courses ({student.courses?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {getCourseBadges(student)}
                    {student.courses && student.courses.length > 2 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{student.courses.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Batch Information */}
                {student.courses && student.courses.length > 0 && (
                  <div className="space-y-2">
                    {student.courses.slice(0, 2).map((course) => (
                      <div key={course.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">{course.batch?.batch_name}</span>
                        {course.batch?.batch_start_time && (
                          <span className="text-gray-500 flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            {formatTime(course.batch.batch_start_time)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Adm: {student.admission_number}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchStudent(student.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <FaEye size={12} />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses & Batches
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={student.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt={student.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{student.full_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <FaEnvelope className="text-gray-400" />
                            {student.email}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {student.contact_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {student.courses?.slice(0, 2).map((course) => (
                          <div key={course.id} className="text-sm">
                            <div className="font-medium text-gray-700">{course.course_name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FaClock className="text-gray-400" />
                              {course.batch?.batch_name} • {formatTime(course.batch?.batch_start_time)}
                            </div>
                          </div>
                        ))}
                        {student.courses && student.courses.length > 2 && (
                          <div className="text-xs text-blue-600">
                            +{student.courses.length - 2} more courses
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(student.admission_date)}</div>
                      <div className="text-xs text-gray-500">#{student.admission_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          student.enrollment_status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {student.enrollment_status}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{student.gender}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => fetchStudent(student.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <FaEye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Profile Column */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <img
                      src={selectedStudent.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt={selectedStudent.full_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 mx-auto mb-4"
                    />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedStudent.full_name}</h3>
                    <p className="text-gray-600 mb-4 flex items-center justify-center gap-2">
                      <FaEnvelope className="text-gray-400" />
                      {selectedStudent.email}
                    </p>
                    <div className="space-y-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedStudent.enrollment_status === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {selectedStudent.enrollment_status}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        selectedStudent.gender === 'Male' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {selectedStudent.gender}
                      </span>
                    </div>
                  </div>

                  {/* Branch Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaBuilding className="text-gray-400" />
                      Branch Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Branch:</span>
                        <p className="font-medium">{selectedStudent.branch?.branch_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">City:</span>
                        <p className="font-medium">{selectedStudent.branch?.city}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Contact:</span>
                        <p className="font-medium">{selectedStudent.branch?.contact_number}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaUser className="text-gray-400" />
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Admission Number:</span>
                          <span className="font-medium">{selectedStudent.admission_number}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Date of Birth:</span>
                          <span className="font-medium">{formatDate(selectedStudent.dob)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">Contact Number:</span>
                          <span className="font-medium">{selectedStudent.contact_number}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium text-right">{selectedStudent.address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Guardian Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaUsers className="text-gray-400" />
                        Guardian Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-600 text-sm">Name:</span>
                          <p className="font-medium">{selectedStudent.guardian_name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">Contact:</span>
                          <p className="font-medium">{selectedStudent.guardian_contact || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Admission Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        Admission Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-600 text-sm">Admission Date:</span>
                          <p className="font-medium">{formatDate(selectedStudent.admission_date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">Total Courses:</span>
                          <p className="font-medium">{selectedStudent.courses?.length || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Courses Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-2">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaBook className="text-gray-400" />
                        Enrolled Courses & Batches
                      </h4>
                      <div className="space-y-4">
                        {selectedStudent.courses?.map((course) => (
                          <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-semibold text-gray-800">{course.course_name}</h5>
                                <p className="text-sm text-gray-600">{course.course_code} • {course.duration} months</p>
                              </div>
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                ₹{course.discounted_price || course.actual_price || '0'}
                              </span>
                            </div>
                            
                            {course.batch && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex justify-between items-center text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Batch:</span>
                                    <span className="ml-2 text-gray-600">{course.batch.batch_name}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-gray-600">
                                      {formatTime(course.batch.batch_start_time)} - {formatTime(course.batch.batch_end_time)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatDate(course.batch.start_date)} to {formatDate(course.batch.end_date)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}