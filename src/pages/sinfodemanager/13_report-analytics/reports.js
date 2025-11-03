import SAAdminLayout from "../../../layouts/Sinfodemanager"; 
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { format, parseISO } from "date-fns";
import {
  FaUsers,
  FaUserCheck,
  FaGraduationCap,
  FaMoneyBillWave,
  FaChartLine,
  FaChartBar,
  FaFilter,
  FaDownload,
  FaFileExcel,
  FaEye,
  FaEdit,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBook,
  FaClock,
  FaBuilding,
  FaIdCard,
  FaVenusMars,
  FaUser,
  FaUsers as FaUserGroup
} from "react-icons/fa";

function Report() {
  const [activeTab, setActiveTab] = useState('students');
  const [studentsData, setStudentsData] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filters, setFilters] = useState({
    course: '',
    batch: '',
    status: '',
    branch: '',
    search: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  // State for student detail modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // State for branch performance
  const [branchPerformance, setBranchPerformance] = useState(null);
  const [branchFilters, setBranchFilters] = useState({
    type: 'month',
    branch_id: '',
    from: '',
    to: ''
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch students data from API
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/students/show", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentsData(res.data || []);
      setFilteredStudents(res.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      showNotification('Failed to load student data', 'error');
    }
  };

  // Fetch branches for filter
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/branches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
      showNotification('Failed to load branches', 'error');
    }
  };

  // Fetch branch performance data
  const fetchBranchPerformance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = {
        type: branchFilters.type,
        ...(branchFilters.branch_id && { branch_id: branchFilters.branch_id }),
        ...(branchFilters.type === 'custom' && branchFilters.from && { from: branchFilters.from }),
        ...(branchFilters.type === 'custom' && branchFilters.to && { to: branchFilters.to })
      };

      const res = await axios.get("/reports/branch-performance", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setBranchPerformance(res.data);
    } catch (error) {
      console.error("Error fetching branch performance:", error);
      showNotification('Failed to load branch performance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchBranches();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [filters, studentsData]);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchBranchPerformance();
    }
  }, [activeTab]);

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

  const handleBranchFilterChange = (filterType, value) => {
    setBranchFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filterStudents = () => {
    const filtered = studentsData.filter(student => {
      const admissionDate = student.admission_date ? new Date(student.admission_date) : null;
      const matchesDateRange = 
        (!filters.dateRange.start || (admissionDate && admissionDate >= new Date(filters.dateRange.start))) &&
        (!filters.dateRange.end || (admissionDate && admissionDate <= new Date(filters.dateRange.end)));
      
      const matchesCourse = !filters.course || 
        student.courses?.some(course => course.course_name === filters.course);
      
      const matchesBatch = !filters.batch || 
        student.courses?.some(course => course.batch?.batch_name === filters.batch);
      
      const matchesBranch = !filters.branch || 
        (student.branch && student.branch.branch_name === filters.branch);

      return (
        matchesCourse &&
        matchesBatch &&
        matchesBranch &&
        (!filters.status || student.enrollment_status === filters.status) &&
        matchesDateRange &&
        (!filters.search || 
          student.full_name.toLowerCase().includes(filters.search.toLowerCase()) || 
          student.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          student.admission_number.toLowerCase().includes(filters.search.toLowerCase()))
      );
    });
    setFilteredStudents(filtered);
  };

  const showNotification = (message, type) => {
    // Implement your notification system here
    console.log(`${type}: ${message}`);
  };

  const exportStudents = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Name,Admission Number,Email,Course,Batch,Branch,Status,Admission Date,Contact Number\n" +
      filteredStudents.map(s => {
        const primaryCourse = s.courses?.[0];
        return `${s.id},${s.full_name},${s.admission_number},${s.email},${primaryCourse?.course_name || 'N/A'},${primaryCourse?.batch?.batch_name || 'N/A'},${s.branch ? s.branch.branch_name : 'N/A'},${s.enrollment_status},${s.admission_date},${s.contact_number}`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Student list exported successfully!', 'success');
  };

  const exportAllData = () => {
    exportStudents();
    showNotification('All reports exported successfully!', 'success');
  };

  const refreshData = () => {
    fetchStudents();
    showNotification('Data refreshed successfully!', 'success');
  };

  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  };

  // Helper function to get status class
  const getStatusClass = (status) => {
    switch(status) {
      case 'Active': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'Inactive': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'Pending': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (key) => {
    if (key === 'course') {
      const courses = studentsData.flatMap(student => 
        student.courses?.map(course => course.course_name) || []
      );
      return [...new Set(courses)].filter(Boolean).sort();
    }
    
    if (key === 'batch') {
      const batches = studentsData.flatMap(student => 
        student.courses?.map(course => course.batch?.batch_name) || []
      );
      return [...new Set(batches)].filter(Boolean).sort();
    }

    if (key === 'branch') {
      const branches = studentsData.map(student => student.branch?.branch_name).filter(Boolean);
      return [...new Set(branches)].sort();
    }

    if (key === 'status') {
      const statuses = studentsData.map(student => student.enrollment_status).filter(Boolean);
      return [...new Set(statuses)].sort();
    }

    return [];
  };

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

  // Calculate percentage for progress bars
  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  return (
    <SAAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-6 mb-8 shadow-xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-2xl backdrop-blur-sm">
                    <FaChartBar className="text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
                    <p className="text-blue-100 text-lg">Comprehensive insights and data management</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={exportAllData} 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <FaDownload className="text-sm" />
                  Export All
                </button>

              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 border border-gray-200">
            <div className="flex flex-wrap border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('students')} 
                className={`px-8 py-4 font-semibold transition-all duration-300 flex items-center gap-3 ${activeTab === 'students' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <FaUsers className="text-lg" />
                Student List
              </button>
 
            </div>
          </div>

          {/* Student List Tab */}
          {activeTab === 'students' && (
            <div>
              {/* Filters */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-xl">
                      <FaFilter className="text-blue-600" />
                    </div>
                    Advanced Filters
                  </h3>
                  <div className="text-sm text-gray-500">
                    {filteredStudents.length} students found
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Course</label>
                    <select 
                      value={filters.course} 
                      onChange={(e) => handleFilterChange('course', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white"
                    >
                      <option value="">All Courses</option>
                      {getUniqueValues('course').map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Batch</label>
                    <select 
                      value={filters.batch} 
                      onChange={(e) => handleFilterChange('batch', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white"
                    >
                      <option value="">All Batches</option>
                      {getUniqueValues('batch').map(batch => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                  </div>

                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={filters.dateRange.start}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={filters.dateRange.end}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search Students</label>
                    <input 
                      type="text" 
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by name, email, or admission number..." 
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Student List */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <FaUsers className="text-indigo-600" />
                    Student List
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                      {filteredStudents.length} students
                    </span>
                  </h3>
                  <button 
                    onClick={exportStudents} 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <FaFileExcel className="text-sm" />
                    Export Excel
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Admission No.</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Course & Batch</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Admission Date</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-blue-50 transition-colors duration-300 group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                                  {student.photo_url ? (
                                    <img 
                                      src={student.photo_url} 
                                      alt={student.full_name}
                                      className="h-12 w-12 rounded-xl object-cover"
                                    />
                                  ) : (
                                    student.full_name.charAt(0)
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {student.full_name}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <FaEnvelope className="text-gray-400 text-xs" />
                                    {student.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                                #{student.admission_number}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {student.courses?.slice(0, 2).map((course, index) => (
                                  <div key={course.id} className="text-sm">
                                    <div className="font-semibold text-gray-800">{course.course_name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <FaClock className="text-gray-400" />
                                      {course.batch?.batch_name} • {formatTime(course.batch?.batch_start_time)}
                                    </div>
                                  </div>
                                ))}
                                {student.courses && student.courses.length > 2 && (
                                  <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                    +{student.courses.length - 2} more courses
                                  </div>
                                )}
                                {(!student.courses || student.courses.length === 0) && (
                                  <span className="text-xs text-gray-500 italic">No courses enrolled</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {student.branch?.branch_name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {student.branch?.city || ''}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusClass(student.enrollment_status)}`}>
                                {student.enrollment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatDate(student.admission_date)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {student.contact_number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => viewStudentDetails(student)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                              >
                                <FaEye className="text-xs" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <FaUsers className="text-2xl text-gray-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Students Found</h3>
                              <p className="text-gray-500 max-w-md">
                                No students match your current filters. Try adjusting your search criteria.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Branch Performance Tab */}
          {activeTab === 'performance' && (
            <div>
              {/* Performance filters and content would go here */}
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaChartLine className="text-3xl text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Branch Performance Analytics</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Detailed branch performance reports and analytics will be displayed here with interactive charts and metrics.
                </p>
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
                  Generate Performance Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Student Detail Modal */}
        {showStudentModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 transform animate-scale-in">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <FaUser className="text-xl text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
                    <p className="text-gray-600">Complete information about {selectedStudent.full_name}</p>
                  </div>
                </div>
                <button
                  onClick={closeStudentModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-xl"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <div className="p-6">
                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Profile Column */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6 text-center shadow-lg">
                      <div className="relative mx-auto w-32 h-32 mb-4">
                        <img
                          src={selectedStudent.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt={selectedStudent.full_name}
                          className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                        />
                        <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white ${
                          selectedStudent.enrollment_status === "Active" ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedStudent.full_name}</h3>
                      <p className="text-gray-600 mb-4 flex items-center justify-center gap-2">
                        <FaEnvelope className="text-gray-400" />
                        {selectedStudent.email}
                      </p>
                      <div className="space-y-2">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                          selectedStudent.enrollment_status === "Active"
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                            : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                        }`}>
                          {selectedStudent.enrollment_status}
                        </span>
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                          selectedStudent.gender === 'Male'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                            : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                        }`}>
                          {selectedStudent.gender}
                        </span>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <FaIdCard className="text-green-600" />
                        </div>
                        Quick Information
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Admission No:</span>
                          <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
                            #{selectedStudent.admission_number}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Contact:</span>
                          <span className="font-bold text-gray-800 flex items-center gap-1">
                            <FaPhone className="text-green-500 text-xs" />
                            {selectedStudent.contact_number}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">Admission Date:</span>
                          <span className="font-bold text-gray-800">{formatDate(selectedStudent.admission_date)}</span>
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
                            <span className="text-gray-600 font-medium">Date of Birth:</span>
                            <span className="font-bold text-gray-800">{formatDate(selectedStudent.dob)}</span>
                          </div>
                          <div className="flex justify-between items-start py-2 border-b border-gray-100">
                            <span className="text-gray-600 font-medium">Address:</span>
                            <span className="font-bold text-gray-800 text-right max-w-xs">{selectedStudent.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Guardian Information */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <FaUserGroup className="text-orange-600" />
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
                            <span className="font-bold text-gray-800 flex items-center gap-1">
                              <FaPhone className="text-green-500 text-xs" />
                              {selectedStudent.guardian_contact || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Branch Information */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <FaBuilding className="text-blue-600" />
                          </div>
                          Branch Information
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-gray-600">Branch:</span>
                            <p className="font-bold text-gray-800">{selectedStudent.branch?.branch_name}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Address:</span>
                            <p className="font-bold text-gray-800">{selectedStudent.branch?.address}</p>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Contact:</span>
                            <span className="font-bold text-gray-800">{selectedStudent.branch?.contact_number}</span>
                          </div>
                        </div>
                      </div>

                      {/* Courses Information */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm md:col-span-2">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
                          <div className="bg-indigo-100 p-2 rounded-lg">
                            <FaBook className="text-indigo-600" />
                          </div>
                          Enrolled Courses & Batches
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {selectedStudent.courses?.map((course) => (
                            <div key={course.id} className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-gray-50 to-white">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="font-bold text-gray-800 text-lg">{course.course_name}</h5>
                                  <p className="text-sm text-gray-600">{course.course_code} • {course.duration} months</p>
                                  <p className="text-xs text-gray-500 mt-1">{course.mode} • {course.course_level}</p>
                                </div>
                                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                                  ₹{course.discounted_price || course.actual_price || '0'}
                                </span>
                              </div>

                              {course.batch && (
                                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                  <div className="flex justify-between items-center text-sm">
                                    <div>
                                      <span className="font-bold text-gray-700">Batch:</span>
                                      <span className="ml-2 text-gray-600 font-medium">{course.batch.batch_name}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-gray-600 font-medium">
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
                          {(!selectedStudent.courses || selectedStudent.courses.length === 0) && (
                            <div className="col-span-2 text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                              <FaBook className="text-4xl text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-600 font-medium">No courses enrolled</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={closeStudentModal}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold"
                >
                  Close
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg">
                  Edit Student
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </SAAdminLayout>
  );
}

export default Report;