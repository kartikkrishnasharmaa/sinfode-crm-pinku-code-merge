import SMLayout from "../../../layouts/StaffLayout";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import Batch from "./batch";
import Allbatch from "./allbatch";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { FaEye, FaSearch, FaFilter, FaBook, FaUsers, FaClock, FaRupeeSign, FaLayerGroup, FaGraduationCap, FaPlus, FaList, FaArrowRight, FaStar, FaChartLine } from "react-icons/fa";

function AllCourse() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    level: "all",
    mode: "all",
    category: "all",
    duration: "all"
  });
  const [loading, setLoading] = useState(true);
  
  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  // Fetch all courses for the user's branch only
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/courses/index", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      
      // Filter courses by user's branch
      const userBranchCourses = data.filter(course => 
        course.branch_id === userBranchId
      );
      
      setCourses(userBranchCourses);
      setFilteredCourses(userBranchCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single course for view
  const fetchSingleCourse = async (id, type) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/courses/${id}/show`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedCourse(res.data);
      setFormData(res.data);
      setModalType(type);
    } catch (error) {
      console.error("Error fetching course:", error);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = courses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply level filter
    if (filters.level !== "all") {
      filtered = filtered.filter(course => course.course_level === filters.level);
    }

    // Apply mode filter
    if (filters.mode !== "all") {
      filtered = filtered.filter(course => course.mode === filters.mode);
    }

    // Apply category filter
    if (filters.category !== "all") {
      filtered = filtered.filter(course => course.course_category === filters.category);
    }

    // Apply duration filter
    if (filters.duration !== "all") {
      if (filters.duration === "short") {
        filtered = filtered.filter(course => course.duration <= 3);
      } else if (filters.duration === "medium") {
        filtered = filtered.filter(course => course.duration > 3 && course.duration <= 6);
      } else if (filters.duration === "long") {
        filtered = filtered.filter(course => course.duration > 6);
      }
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filters]);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      level: "all",
      mode: "all",
      category: "all",
      duration: "all"
    });
    setSearchTerm("");
  };

  // Get course statistics
  const getCourseStats = () => {
    const total = courses.length;
    const online = courses.filter(c => c.mode === "Online").length;
    const offline = courses.filter(c => c.mode === "Offline").length;
    const technical = courses.filter(c => c.course_category === "Technical").length;
    
    return { total, online, offline, technical };
  };

  const stats = getCourseStats();

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 font-nunito bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Course Management
        </h1>
        <p className="text-gray-600 text-lg">
          Discover and manage all your courses in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Courses</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.total}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <FaBook className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Online Courses</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.online}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <FaChartLine className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Offline Courses</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.offline}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <FaUsers className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-4">
            <button
              onClick={resetFilters}
              className="px-4 py-3 border-2 bg-blue-600 border-gray-300 text-white rounded-xl font-semibold hover:bg-blue-500 transition-all duration-200 flex items-center gap-2"
            >
              <FaFilter />
              Reset
            </button>
          </div>
        </div>

        {/* Filter Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* Level Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Level</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({...filters, level: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Mode</label>
            <select
              value={filters.mode}
              onChange={(e) => setFilters({...filters, mode: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Non-Technical">Non-Technical</option>
            </select>
          </div>

          {/* Duration Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
            <select
              value={filters.duration}
              onChange={(e) => setFilters({...filters, duration: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Durations</option>
              <option value="short">Short (1-3 months)</option>
              <option value="medium">Medium (4-6 months)</option>
              <option value="long">Long (7+ months)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Showing <span className="font-bold text-blue-600">{filteredCourses.length}</span> of <span className="font-bold">{courses.length}</span> courses
        </p>
        <div className="flex gap-2">
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
            {filters.level !== "all" && filters.level}
          </span>
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
            {filters.mode !== "all" && filters.mode}
          </span>
          <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
            {filters.category !== "all" && filters.category}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-700">Loading courses...</h3>
          <p className="text-gray-500 mt-2">Please wait while we fetch your courses</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">No Courses Found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={resetFilters}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
          {filteredCourses.map((course, index) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Course Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
                {/* Level Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${
                  course.course_level === "Beginner"
                    ? "bg-green-500 text-white"
                    : course.course_level === "Intermediate"
                    ? "bg-yellow-500 text-white"
                    : "bg-red-500 text-white"
                }`}>
                  {course.course_level}
                </div>

                {/* Mode Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold bg-white ${
                  course.mode === "Online"
                    ? "text-blue-600"
                    : course.mode === "Offline"
                    ? "text-purple-600"
                    : "text-teal-600"
                }`}>
                  {course.mode}
                </div>

                <div className="pt-8">
                  <h2 className="text-xl font-bold mb-2 line-clamp-2">
                    {course.course_name}
                  </h2>
                  <p className="text-blue-100 opacity-90 flex items-center gap-2">
                    <FaLayerGroup />
                    {course.course_category}
                  </p>
                </div>
              </div>

              {/* Course Body */}
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <FaClock className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold">{course.duration} months</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600">
                    <FaGraduationCap className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-semibold">{course.course_category}</p>
                    </div>
                  </div>

                  {course.branch && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <FaUsers className="text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500">Branch</p>
                        <p className="font-semibold">{course.branch.branch_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{course.discounted_price || course.actual_price}
                      </span>
                      {course.discounted_price && course.actual_price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ₹{course.actual_price}
                        </span>
                      )}
                    </div>
                    {course.discounted_price && course.actual_price && (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-semibold">
                        Save ₹{course.actual_price - course.discounted_price}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => fetchSingleCourse(course.id, "view")}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-md"
                  >
                    <FaEye />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced View Modal */}
      {modalType === "view" && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedCourse.course_name}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {selectedCourse.course_code}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {selectedCourse.course_category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setModalType("")}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all duration-200 transform hover:scale-110"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Course Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <FaLayerGroup className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Level</p>
                      <p className="font-semibold text-gray-800">{selectedCourse.course_level}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <FaClock className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-800">{selectedCourse.duration} months</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <FaUsers className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mode</p>
                      <p className="font-semibold text-gray-800">{selectedCourse.mode}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <FaRupeeSign className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="font-semibold text-gray-800">₹{selectedCourse.discounted_price || selectedCourse.actual_price}</p>
                    </div>
                  </div>
                </div>

                {selectedCourse.branch && (
                  <div className="bg-teal-50 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-teal-500 p-2 rounded-lg">
                        <FaUsers className="text-white text-lg" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Branch</p>
                        <p className="font-semibold text-gray-800">{selectedCourse.branch.branch_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedCourse.trainer && (
                  <div className="bg-pink-50 p-4 rounded-xl transform hover:scale-105 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-pink-500 p-2 rounded-lg">
                        <FaUsers className="text-white text-lg" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Trainer</p>
                        <p className="font-semibold text-gray-800">{selectedCourse.trainer.employee_name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaBook className="text-blue-500" />
                  Course Description
                </h3>
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: selectedCourse.course_description || "<p class='text-gray-500'>No description provided.</p>",
                  }}
                />
              </div>

              {/* Students Section */}
              {selectedCourse.students && selectedCourse.students.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaUsers className="text-green-500" />
                    Enrolled Students ({selectedCourse.students.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCourse.students.map((student) => (
                      <div
                        key={student.id}
                        className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all duration-200 transform hover:scale-105"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={student.photo_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                            alt={student.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 truncate">{student.full_name}</h4>
                            <p className="text-sm text-gray-500 truncate">{student.email}</p>
                            <p className="text-xs text-gray-400">{student.contact_number}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-gray-50 rounded-b-3xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setModalType("")}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Course() {
  const [activeTab, setActiveTab] = useState("courseList");

  return (
    <SMLayout>
      <div className="flex h-full bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Enhanced Sidebar */}
        <div className="w-80 bg-white rounded-2xl shadow-xl m-4 p-6 space-y-4 flex-shrink-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Learning Center
            </h2>
            <p className="text-gray-600">Manage your educational programs</p>
          </div>
          
          <button
            onClick={() => setActiveTab("courseList")}
            className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 group ${
              activeTab === "courseList"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform -translate-y-1"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md"
            }`}
          >
            <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              activeTab === "courseList" ? "bg-white/20" : "bg-blue-100 text-blue-600"
            }`}>
              <FaList className="text-lg" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">All Courses</div>
              <div className="text-sm opacity-80">Browse all courses</div>
            </div>
            <FaArrowRight className={`transition-all duration-300 ${
              activeTab === "courseList" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`} />
          </button>

          <button
            onClick={() => setActiveTab("batchManagement")}
            className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 group ${
              activeTab === "batchManagement"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform -translate-y-1"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md"
            }`}
          >
            <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              activeTab === "batchManagement" ? "bg-white/20" : "bg-green-100 text-green-600"
            }`}>
              <FaPlus className="text-lg" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Add Batches</div>
              <div className="text-sm opacity-80">Create new batches</div>
            </div>
            <FaArrowRight className={`transition-all duration-300 ${
              activeTab === "batchManagement" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`} />
          </button>

          <button
            onClick={() => setActiveTab("allBatches")}
            className={`w-full text-left p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 group ${
              activeTab === "allBatches"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform -translate-y-1"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md"
            }`}
          >
            <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              activeTab === "allBatches" ? "bg-white/20" : "bg-purple-100 text-purple-600"
            }`}>
              <FaUsers className="text-lg" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">All Batches</div>
              <div className="text-sm opacity-80">Manage all batches</div>
            </div>
            <FaArrowRight className={`transition-all duration-300 ${
              activeTab === "allBatches" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`} />
          </button>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 m-4 overflow-hidden">
          <div className="h-full overflow-y-auto rounded-2xl">
            {activeTab === "courseList" && <AllCourse />}
            {activeTab === "batchManagement" && <Batch />}
            {activeTab === "allBatches" && <Allbatch />}
          </div>
        </div>
      </div>

      {/* Add custom animations to global CSS */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </SMLayout>
  );
}