import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import SAStaffLayout from "../../../layouts/StaffLayout";

import * as XLSX from "xlsx";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaVenusMars,
  FaIdCard,
  FaSchool,
  FaClock,
  FaChalkboardTeacher,
  FaFileExport,
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Allstudents() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const navigate = useNavigate();
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  // New states for course selection in edit modal
  const [selectedEditCourses, setSelectedEditCourses] = useState([]);
  const [courseBatches, setCourseBatches] = useState({});
  const [editTotalFee, setEditTotalFee] = useState(0);

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

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/courses/index", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/batches/show", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const batchData = Array.isArray(res.data) ? res.data : res.data.data || [];
      setBatches(batchData);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchBranches();
    fetchCourses();
    fetchBatches();
  }, []);

  const fetchStudent = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/students/show/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      console.error("Error fetching student:", error);
      return null;
    }
  };

  const handleViewStudent = async (id) => {
    setIsLoading(true);
    const studentData = await fetchStudent(id);
    if (studentData) {
      setSelectedStudent(studentData);
      setShowViewModal(true);
    }
    setIsLoading(false);
    setOpenMenuId(null);
  };

  const handleEditStudent = async (id) => {
    setIsLoading(true);
    const studentData = await fetchStudent(id);
    if (studentData) {
      setSelectedStudent(studentData);
      setEditFormData(studentData);
      setPhotoPreview(studentData.photo_url || "");

      // Initialize course selection for edit
      const initialCourses = studentData.courses?.map(c => c.id) || [];
      setSelectedEditCourses(initialCourses);

      const initialBatches = {};
      studentData.courses?.forEach(course => {
        if (course.batch) {
          initialBatches[course.id] = course.batch.id;
        }
      });
      setCourseBatches(initialBatches);

      // Calculate total fee
      let calculatedFee = 0;
      initialCourses.forEach(courseId => {
        const course = courses.find(c => c.id == courseId);
        if (course) {
          const fee = parseFloat(course.discounted_price || course.actual_price || 0);
          calculatedFee += fee;
        }
      });
      setEditTotalFee(calculatedFee);

      setShowEditModal(true);
    }
    setIsLoading(false);
    setOpenMenuId(null);
  };

  // Course selection handlers for edit modal
  const handleEditCourseSelection = (courseId) => {
    setSelectedEditCourses(prev => {
      if (prev.includes(courseId)) {
        // Remove course and its batch selection
        const newCourseBatches = { ...courseBatches };
        delete newCourseBatches[courseId];
        setCourseBatches(newCourseBatches);
        return prev.filter(id => id !== courseId);
      } else {
        // Add course
        return [...prev, courseId];
      }
    });
  };

  const handleEditBatchSelection = (courseId, batchId) => {
    setCourseBatches(prev => ({
      ...prev,
      [courseId]: batchId
    }));
  };

  // Get batches for a specific course
  const getBatchesForCourse = (courseId) => {
    return batches.filter(batch => 
      batch.course_id == courseId || 
      (batch.courses && batch.courses.some(course => course.id == courseId))
    );
  };

  // Format time for display
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

  // Calculate total fee when courses change
  useEffect(() => {
    if (selectedEditCourses.length > 0) {
      let calculatedFee = 0;
      selectedEditCourses.forEach(courseId => {
        const course = courses.find(c => c.id == courseId);
        if (course) {
          const fee = parseFloat(course.discounted_price || course.actual_price || 0);
          calculatedFee += fee;
        }
      });
      setEditTotalFee(calculatedFee);
    } else {
      setEditTotalFee(0);
    }
  }, [selectedEditCourses, courses]);

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Append basic student information
      formData.append("full_name", editFormData.full_name);
      formData.append("dob", editFormData.dob);
      formData.append("gender", editFormData.gender);
      formData.append("contact_number", editFormData.contact_number);
      formData.append("email", editFormData.email);
      formData.append("address", editFormData.address);
      formData.append("guardian_name", editFormData.guardian_name);
      formData.append("guardian_contact", editFormData.guardian_contact);
      formData.append("admission_date", editFormData.admission_date);
      formData.append("branch_id", editFormData.branch_id);
      formData.append("admission_number", editFormData.admission_number);

      // Append course and batch data
      selectedEditCourses.forEach(courseId => {
        formData.append("courses[]", courseId);
        formData.append(`batch_${courseId}`, courseBatches[courseId]);
      });

      // Append fee information
      formData.append("course_fee", editTotalFee);
      formData.append("final_fee", editTotalFee);

      // Append photo if changed
      if (editPhoto) {
        formData.append("photo", editPhoto);
      }

      await axios.put(`/students/update/${selectedStudent.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setShowEditModal(false);
      fetchStudents();
      toast.success("Student updated successfully!");
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student.");
    }
    setIsLoading(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditPhoto(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact_number" || name === "guardian_contact") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setEditFormData({ ...editFormData, [name]: numericValue });
    } else {
      setEditFormData({ ...editFormData, [name]: value });
    }
  };

  const handleDeleteStudent = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/students/destroy/${selectedStudent.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      fetchStudents();
      toast.success("Student deleted successfully!");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student.");
    }
    setIsLoading(false);
  };

  const exportToExcel = () => {
    const dataForExport = filteredStudents.map((student) => ({
      "Admission No": student.admission_number,
      "Full Name": student.full_name,
      Email: student.email,
      Contact: student.contact_number,
      Gender: student.gender,
      DOB: formatDate(student.dob),
      "Admission Date": formatDate(student.admission_date),
      "Guardian Name": student.guardian_name,
      "Guardian Contact": student.guardian_contact,
      Address: student.address,
      Branch: student.branch?.branch_name,
      "Courses": student.courses?.map(c => c.course_name).join(", ") || "N/A",
      "Batches": student.courses?.map(c => c.batch?.batch_name).filter(Boolean).join(", ") || "N/A",
      "Batch Timings": student.courses?.map(c => 
        c.batch ? formatBatchTiming(c.batch.batch_start_time, c.batch.batch_end_time) : "N/A"
      ).filter(timing => timing !== "N/A").join(" | ") || "N/A",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);

    const columnWidths = [
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 40 },
      { wch: 35 },
      { wch: 50 },
      { wch: 50 },
      { wch: 40 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "students.xlsx");
  };

  const formatTimeToIST = (timeString) => {
    if (!timeString) return "N/A";
    
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0);
      
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return "N/A";
    }
  };

  const formatBatchTiming = (startTime, endTime) => {
    if (!startTime && !endTime) return "Timing not set";
    if (!startTime) return `Till ${formatTimeToIST(endTime)}`;
    if (!endTime) return `From ${formatTimeToIST(startTime)}`;
    
    return `${formatTimeToIST(startTime)} - ${formatTimeToIST(endTime)}`;
  };

  const filteredStudents = students
    .filter(s =>
      (selectedBranch === "" || s.branch_id === parseInt(selectedBranch)) &&
      (
        (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.admission_number || "").toLowerCase().includes(search.toLowerCase())
      )
    )
    .filter(s => {
      if (dateFilter.from && new Date(s.created_at) < new Date(dateFilter.from)) return false;
      if (dateFilter.to && new Date(s.created_at) > new Date(dateFilter.to)) return false;
      return true;
    })
    .sort((a, b) => {
      const valA = a[sortField] || "";
      const valB = b[sortField] || "";
      if (sortOrder === "asc") return new Date(valA) - new Date(valB);
      return new Date(valB) - new Date(valA);
    });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-nunito font-semibold">
          Students <span className="text-gray-600">({filteredStudents.length})</span>
        </h1>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-full md:w-60 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch_name}
              </option>
            ))}
          </select>

          <div className="flex gap-2 bg-gray-200 p-1 rounded-full shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "list"
                ? "bg-[#3F8CFF] text-white"
                : "bg-transparent text-gray-600 hover:bg-gray-300"
                }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "card"
                ? "bg-[#3F8CFF] text-white"
                : "bg-transparent text-gray-600 hover:bg-gray-300"
                }`}
            >
              Card View
            </button>
          </div>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors shrink-0 text-sm md:px-4 md:py-2 md:text-base"
            type="button"
          >
            <FaFileExport /> Export Excel
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search by name, email, or admission number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          value={sortField}
          onChange={e => setSortField(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="created_at">Sort by Created Date</option>
          <option value="admission_date">Sort by Admission Date</option>
          <option value="dob">Sort by Date of Birth</option>
        </select>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
        <input
          type="date"
          value={dateFilter.from}
          onChange={e => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
          className="border p-2 rounded"
          placeholder="From"
        />
        <input
          type="date"
          value={dateFilter.to}
          onChange={e => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
          className="border p-2 rounded"
          placeholder="To"
        />
        <button
          onClick={() => setDateFilter({ from: "", to: "" })}
          className="bg-[#3F8CFF] hover:bg-blue-700 text-white px-4 py-2 rounded-3xl flex items-center gap-2"
        >
          Reset Dates
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" ? (
        <div className="overflow-x-auto">
          <div className="min-w-[700px] md:min-w-[900px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 bg-gray-100 p-4 rounded-t-lg font-semibold text-sm md:text-base">
              <div className="col-span-3 flex items-center">Student</div>
              <div className="col-span-2 text-gray-600 truncate hidden sm:block">Email</div>
              <div className="col-span-2 text-gray-600 hidden md:flex items-center">Contact</div>
              <div className="col-span-2 text-gray-600 hidden md:flex items-center">Branch</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-white shadow-sm hover:shadow-md transition rounded-xl p-4 grid grid-cols-12 gap-4 items-center text-sm md:text-base"
                >
                  <div className="col-span-3 flex items-center gap-4">
                    <img
                      src={student.photo_url || "https://rapidapi.com/hub/_next/image?url=https%3A%2F%2Frapidapi-prod-apis.s3.amazonaws.com%2F0499ccca-a115-4e70-b4f3-1c1587d6de2b.png&w=3840&q=75"}
                      alt={student.full_name}
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800 truncate">{student.full_name}</h3>
                      <p className="text-gray-500 text-xs md:text-sm">
                        {student.gender} • {formatDate(student.dob)}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 text-gray-600 truncate hidden sm:block">
                    {student.email || "N/A"}
                  </div>

                  <div className="col-span-2 text-gray-600 hidden md:block">
                    {student.contact_number || "N/A"}
                  </div>

                  <div className="col-span-2 text-gray-600 hidden md:block">
                    {student.branch?.branch_name || "N/A"}
                  </div>

                  <div className="col-span-1 flex justify-center relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === student.id ? null : student.id)
                      }
                      className="menu-toggle p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Open Actions Menu"
                    >
                      <HiDotsVertical size={20} />
                    </button>

                    {openMenuId === student.id && (
                      <div
                        className="menu-container absolute right-0 mt-2 bg-white shadow-lg rounded-lg w-44 py-2 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleViewStudent(student.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-purple-600 text-left text-sm"
                        >
                          <FaEye size={16} /> View
                        </button>
                        <button
                          onClick={() => handleEditStudent(student.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-blue-600 text-left text-sm"
                        >
                          <FaEdit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDeleteModal(true);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600 text-left text-sm"
                        >
                          <FaTrash size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Card View
        <div className="grid mt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition p-6 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md -mt-12 mb-3">
                <img
                  src={student.photo_url || "https://rapidapi.com/hub/_next/image?url=https%3A%2F%2Frapidapi-prod-apis.s3.amazonaws.com%2F0499ccca-a115-4e70-b4f3-1c1587d6de2b.png&w=3840&q=75"}
                  alt={student.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold truncate w-full">{student.full_name}</h3>
              <p className="text-gray-500 truncate w-full hidden sm:block">{student.email}</p>
              <p className="text-gray-500 truncate w-full hidden md:block">{student.contact_number}</p>
              <div className="bg-gray-50 rounded-lg py-2 px-4 mt-4 w-full text-sm">
                <p className="text-gray-800 font-semibold truncate">
                  Admission No: {student.admission_number}
                </p>
              </div>
              <span className="mt-3 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 hidden md:inline-block w-fit truncate max-w-full">
                Admission Date: {formatDate(student.admission_date)}
              </span>

              <div className="flex mt-4 space-x-3">
                <button
                  onClick={() => handleViewStudent(student.id)}
                  className="p-2 text-purple-600 hover:bg-purple-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                  title="View"
                  type="button"
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => handleEditStudent(student.id)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  title="Edit"
                  type="button"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => {
                    setSelectedStudent(student);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Delete"
                  type="button"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed ml-[270px] inset-0 bg-black bg-opacity-50 flex mt-[100px] items-center justify-center z-[900px] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Student Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                aria-label="Close View Modal"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <img
                    src={selectedStudent.photo_url || "https://rapidapi.com/hub/_next/image?url=https%3A%2F%2Frapidapi-prod-apis.s3.amazonaws.com%2F0499ccca-a115-4e70-b4f3-1c1587d6de2b.png&w=3840&q=75"}
                    alt={selectedStudent.full_name}
                    className="w-40 h-40 rounded-full object-cover border-4 border-blue-100"
                  />
                </div>

                <div className="flex-grow">
                  <h1 className="text-3xl font-bold mb-2">{selectedStudent.full_name}</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-700">
                      <FaIdCard className="mr-2 text-blue-500" />
                      <span>Admission No: {selectedStudent.admission_number}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaVenusMars className="mr-2 text-blue-500" />
                      <span>Gender: {selectedStudent.gender}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      <span>DOB: {formatDate(selectedStudent.dob)}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      <span>Admission: {formatDate(selectedStudent.admission_date)}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaEnvelope className="mr-2 text-blue-500" />
                      <span>{selectedStudent.email}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaPhone className="mr-2 text-blue-500" />
                      <span>{selectedStudent.contact_number}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-blue-500" />
                    Address
                  </h3>
                  <p className="text-gray-700">{selectedStudent.address}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <FaUser className="mr-2 text-blue-500" />
                    Guardian Information
                  </h3>
                  <p className="text-gray-700">
                    <strong>Name:</strong> {selectedStudent.guardian_name}
                  </p>
                  <p className="text-gray-700">
                    <strong>Contact:</strong> {selectedStudent.guardian_contact}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <FaSchool className="mr-2 text-blue-500" />
                    Branch
                  </h3>
                  <p className="text-gray-700 font-medium">{selectedStudent.branch?.branch_name}</p>
                  <p className="text-gray-600 text-sm">{selectedStudent.branch?.address}</p>
                  <p className="text-gray-600 text-sm">
                    {selectedStudent.branch?.city}, {selectedStudent.branch?.state}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <FaChalkboardTeacher className="mr-2 text-green-500" />
                    Courses ({selectedStudent.courses?.length || 0})
                  </h3>
                  {selectedStudent.courses && selectedStudent.courses.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStudent.courses.map((course, index) => (
                        <div key={course.id} className="border-b border-green-200 pb-2 last:border-b-0">
                          <p className="text-gray-700 font-medium">{course.course_name}</p>
                          <div className="text-gray-600 text-sm space-y-1">
                            <p>Duration: {course.duration} months</p>
                            <p>Mode: {course.mode}</p>
                            <p>Level: {course.course_level}</p>
                            {course.batch && (
                              <div className="bg-white p-2 rounded border mt-1">
                                <p className="font-medium">Batch: {course.batch.batch_name}</p>
                                <p>Timing: {formatBatchTiming(course.batch.batch_start_time, course.batch.batch_end_time)}</p>
                                <p>Days: Mon - Sat</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No courses enrolled</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Edit Student</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditPhoto(null);
                  setPhotoPreview("");
                }}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                aria-label="Close Edit Modal"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6">
              {/* Basic Information */}
              <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editFormData.full_name || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Number *</label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={editFormData.contact_number || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      required
                    />
                    {editFormData.contact_number && editFormData.contact_number.length !== 10 && (
                      <p className="text-red-500 text-xs mt-1">Must be exactly 10 digits</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      name="dob"
                      value={editFormData.dob || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender *</label>
                    <select
                      name="gender"
                      value={editFormData.gender || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Admission Number *</label>
                    <input
                      type="text"
                      name="admission_number"
                      value={editFormData.admission_number || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Student Photo</label>
                    <input
                      type="file"
                      onChange={handlePhotoChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      accept="image/*"
                    />
                    {photoPreview && (
                      <div className="mt-2">
                        <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    name="address"
                    value={editFormData.address || ""}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Guardian Name</label>
                    <input
                      type="text"
                      name="guardian_name"
                      value={editFormData.guardian_name || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Guardian Contact</label>
                    <input
                      type="tel"
                      name="guardian_contact"
                      value={editFormData.guardian_contact || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      pattern="[0-9]{10}"
                      maxLength="10"
                    />
                    {editFormData.guardian_contact && editFormData.guardian_contact.length !== 10 && (
                      <p className="text-red-500 text-xs mt-1">Must be exactly 10 digits</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Admission Date *</label>
                    <input
                      type="date"
                      name="admission_date"
                      value={editFormData.admission_date || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Branch *</label>
                    <select
                      name="branch_id"
                      value={editFormData.branch_id || ""}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">-- Select Branch --</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.branch_name} - {branch.city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Course Enrollment Section */}
              <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Course Enrollment</h2>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedEditCourses.length} course(s) selected
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div 
                      key={course.id} 
                      className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                        selectedEditCourses.includes(course.id) 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`edit-course-${course.id}`}
                          checked={selectedEditCourses.includes(course.id)}
                          onChange={() => handleEditCourseSelection(course.id)}
                          className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex-1 min-w-0">
                          <label 
                            htmlFor={`edit-course-${course.id}`}
                            className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 block text-sm"
                          >
                            {course.course_name}
                          </label>
                          
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Code:</span> {course.course_code}
                            </p>
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Duration:</span> {course.duration} months
                            </p>
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Mode:</span> 
                              <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                                course.mode === 'Online' ? 'bg-green-100 text-green-800' :
                                course.mode === 'Offline' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {course.mode}
                              </span>
                            </p>
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Level:</span> {course.course_level}
                            </p>
                          </div>

                          <div className="mt-3">
                            <span className="text-lg font-bold text-green-600">
                              ₹{course.discounted_price || course.actual_price || "0"}
                            </span>
                          </div>
                          
                          {/* Batch selection for selected courses */}
                          {selectedEditCourses.includes(course.id) && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <label className="block text-sm font-semibold mb-2 text-gray-700">
                                Select Batch *
                              </label>
                              <select
                                value={courseBatches[course.id] || ""}
                                onChange={(e) => handleEditBatchSelection(course.id, e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              >
                                <option value="">Choose a batch</option>
                                {getBatchesForCourse(course.id).map((batch) => (
                                  <option key={batch.id} value={batch.id}>
                                    {batch.batch_name} 
                                    {batch.batch_start_time && ` (${formatTime(batch.batch_start_time)})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Selected Courses Summary */}
                {selectedEditCourses.length > 0 && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">Enrollment Summary</h3>
                    <div className="space-y-3">
                      {selectedEditCourses.map(courseId => {
                        const course = courses.find(c => c.id == courseId);
                        const batch = batches.find(b => b.id == courseBatches[courseId]);
                        return course ? (
                          <div key={courseId} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{course.course_name}</div>
                              {batch && (
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Batch:</span> {batch.batch_name}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                ₹{course.discounted_price || course.actual_price || "0"}
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}
                      <div className="border-t border-blue-200 pt-3 mt-2">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span className="text-gray-800">Total Fee:</span>
                          <span className="text-blue-600">₹{editTotalFee}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditPhoto(null);
                    setPhotoPreview("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                aria-label="Close Delete Modal"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete student{" "}
                <strong>{selectedStudent.full_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                  disabled={isLoading}
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}