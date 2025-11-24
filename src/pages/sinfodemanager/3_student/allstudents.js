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
  FaClock,
  FaUserGraduate,
  FaChartLine,
  FaMoneyBillWave,
  FaCertificate
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
  const [viewMode, setViewMode] = useState("list");
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

  // Get unique values for filters from backend data
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
      return [<span key="none" className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium">No Courses</span>];
    }

    return student.courses.slice(0, 2).map((course, index) => (
      <span
        key={course.id}
        className={`px-3 py-1.5 rounded-full text-xs font-medium ${index === 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'}`}
      >
        {course.course_name}
      </span>
    ));
  };

  // Calculate stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.enrollment_status === 'Active').length;
  const totalCourses = students.reduce((acc, student) => acc + (student.courses?.length || 0), 0);
  const thisMonthAdmissions = students.filter(student => {
    const admissionDate = new Date(student.admission_date);
    const now = new Date();
    return admissionDate.getMonth() === now.getMonth() && admissionDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-blue-100">
            <FaUserGraduate className="text-3xl text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Students Management
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Manage and track all student information in one place
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${viewMode === "list"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "bg-transparent text-gray-600 hover:bg-gray-50"
                }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${viewMode === "grid"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "bg-transparent text-gray-600 hover:bg-gray-50"
                }`}
            >
              Grid View
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Enhanced CRM Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{totalStudents}</p>
              <div className="flex items-center gap-1 mt-2">
                <FaChartLine className="text-green-500 text-sm" />
                <span className="text-xs text-green-600 font-medium">All time</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl">
              <FaUsers className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Students</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeStudents}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-600 font-medium">{Math.round((activeStudents / totalStudents) * 100)}% active</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl">
              <FaUser className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Courses</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{totalCourses}</p>

            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl">
              <FaBook className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">New This Month</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{thisMonthAdmissions}</p>

            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl">
              <FaCalendarAlt className="text-2xl text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search */}
          <div className="flex-1 relative min-w-0">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search students by name, email, or admission number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 bg-gray-50 hover:bg-white"
              />
            </div>
          </div>

          {/* Branch Dropdown - only for admin */}
          {userRole === "admin" && (
            <div className="w-full lg:w-64">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 hover:bg-white transition-all duration-300 appearance-none"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-3 font-semibold ${Object.values(filters).some(filter =>
              typeof filter === 'string' ? filter !== 'all' : Object.values(filter).some(Boolean)
            )
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
          >
            <FaFilter className="text-sm" />
            Filters
            {Object.values(filters).some(filter =>
              typeof filter === 'string' ? filter !== 'all' : Object.values(filter).some(Boolean)
            ) && (
                <span className="bg-white text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  !
                </span>
              )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl shadow-inner border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FaFilter className="text-blue-600 text-lg" />
                </div>
                Advanced Filters
              </h2>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaVenusMars className="text-gray-400" />
                  Gender
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-300"
                >
                  <option value="all">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  {uniqueGenders.filter(gender => !['Male', 'Female'].includes(gender)).map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaUser className="text-gray-400" />
                  Status
                </label>
                <select
                  value={filters.enrollment_status}
                  onChange={(e) => handleFilterChange('enrollment_status', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-300"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  {uniqueEnrollmentStatuses.filter(status => !['Active', 'Inactive'].includes(status)).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaClock className="text-gray-400" />
                  Batch
                </label>
                <select
                  value={filters.batch}
                  onChange={(e) => handleFilterChange('batch', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-300"
                >
                  <option value="all">All Batches</option>
                  {uniqueBatches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaBook className="text-gray-400" />
                  Course
                </label>
                <select
                  value={filters.course}
                  onChange={(e) => handleFilterChange('course', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-300"
                >
                  <option value="all">All Courses</option>
                  {uniqueCourses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admission Date - Improved Layout */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaCalendarAlt className="text-gray-400" />
                  Admission Date
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-300 appearance-none"
                      placeholder="Start date"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-300 appearance-none"
                      placeholder="End date"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
          Showing <span className="font-bold text-blue-600">{processedStudents.length}</span> of{" "}
          <span className="font-bold text-gray-800">{students.length}</span> students
        </div>

      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-2 gap-6">
          {processedStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200 overflow-hidden group transform hover:-translate-y-2"
            >
              {/* Header with Image and Basic Info */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={student.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt={student.full_name}
                      className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg group-hover:border-blue-100 transition-colors"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${student.enrollment_status === "Active" ? "bg-green-500" : "bg-red-500"
                      }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                      {student.full_name}
                    </h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <FaEnvelope className="text-gray-400 text-xs" />
                      <span className="truncate">{student.email}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${student.enrollment_status === "Active"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm"
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm"
                        }`}>
                        {student.enrollment_status}
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${student.gender === 'Male'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                          : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
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
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FaBook className="text-gray-400" />
                    Enrolled Courses ({student.courses?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {getCourseBadges(student)}
                    {student.courses && student.courses.length > 2 && (
                      <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        +{student.courses.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Admission No:</span>
                    <span className="font-semibold text-gray-800">{student.admission_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Admission Date:</span>
                    <span className="font-semibold text-gray-800">{formatDate(student.admission_date)}</span>
                  </div>
                </div>
              </div>

              {/* Footer with Actions */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 font-medium">
                    {student.branch?.branch_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchStudent(student.id)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Student Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Courses & Batches
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Admission Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50 transition-colors duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={student.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt={student.full_name}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${student.enrollment_status === "Active" ? "bg-green-500" : "bg-red-500"
                            }`}></div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{student.full_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <FaEnvelope className="text-gray-400 text-xs" />
                            {student.email}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <FaPhone className="text-gray-400" />
                            {student.contact_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {student.courses?.slice(0, 2).map((course) => (
                          <div key={course.id} className="text-sm">
                            <div className="font-semibold text-gray-800">{course.course_name}</div>
                            {/* <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FaClock className="text-gray-400" />
                              {course.batch?.batch_name}
                            </div> */}
                          </div>
                        ))}
                        {student.courses && student.courses.length > 2 && (
                          <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            +{student.courses.length - 2} more courses
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900">{formatDate(student.admission_date)}</div>
                        <div className="text-xs text-gray-500 font-medium">#{student.admission_number}</div>
                        <div className="text-xs text-gray-400">{student.branch?.branch_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${student.enrollment_status === "Active"
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm"
                            : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm"
                          }`}>
                          {student.enrollment_status}
                        </span>
                        <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${student.gender === 'Male'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                            : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm'
                          }`}>
                          {student.gender}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => fetchStudent(student.id)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                      >
                        <FaEye size={12} />
                        View Details
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white z-10">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-2xl">
                  <FaUserGraduate className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
                  <p className="text-gray-600">Complete information about {selectedStudent.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-3 hover:bg-gray-100 rounded-2xl"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-8">
              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Profile Column */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6 text-center shadow-lg">
                    <img
                      src={selectedStudent.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt={selectedStudent.full_name}
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg mx-auto mb-4"
                    />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedStudent.full_name}</h3>

                    <div className="space-y-2">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${selectedStudent.enrollment_status === "Active"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                        }`}>
                        {selectedStudent.enrollment_status}
                      </span>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${selectedStudent.gender === 'Male'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                        }`}>
                        {selectedStudent.gender}
                      </span>
                    </div>
                  </div>

                  {/* Branch Information */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FaBuilding className="text-blue-600" />
                      </div>
                      Branch Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Branch:</span>
                        <span className="font-bold text-gray-800">{selectedStudent.branch?.branch_name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">City:</span>
                        <span className="font-bold text-gray-800">{selectedStudent.branch?.city}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Contact:</span>
                        <span className="font-bold text-gray-800">{selectedStudent.branch?.contact_number}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <FaUser className="text-purple-600" />
                        </div>
                        Personal Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Admission Number:</span>
                          <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">#{selectedStudent.admission_number}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Date of Birth:</span>
                          <span className="font-bold text-gray-800">{formatDate(selectedStudent.dob)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Contact Number:</span>
                          <span className="font-bold text-gray-800 flex items-center gap-2">
                            <FaPhone className="text-green-500" />
                            {selectedStudent.contact_number}
                          </span>
                        </div>
                        <div className="flex justify-between items-start py-2">
                          <span className="text-gray-600 font-medium">Address:</span>
                          <span className="font-bold text-gray-800 text-right max-w-xs">{selectedStudent.address || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div className="text-gray-600 font-medium">Email:</div>
                          {selectedStudent.email}
                        </div>

                      </div>
                    </div>

                    {/* Guardian Information */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <FaUsers className="text-green-600" />
                        </div>
                        Guardian Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Name:</span>
                          <span className="font-bold text-gray-800">{selectedStudent.guardian_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">Contact:</span>
                          <span className="font-bold text-gray-800 flex items-center gap-2">
                            <FaPhone className="text-green-500" />
                            {selectedStudent.guardian_contact || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admission Information */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <FaCalendarAlt className="text-orange-600" />
                        </div>
                        Admission Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Admission Date:</span>
                          <span className="font-bold text-gray-800">{formatDate(selectedStudent.admission_date)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Total Courses:</span>
                          <span className="font-bold text-gray-800 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                            {selectedStudent.courses?.length || 0}
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Quick Actions */}

                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex justify-end gap-4 bg-gradient-to-r from-gray-50 to-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold"
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