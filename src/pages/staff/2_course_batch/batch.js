import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { ToastContainer, toast } from 'react-toastify';
import { FaUsers, FaBook, FaCalendarAlt, FaClock, FaPlus, FaGraduationCap, FaUserFriends, FaRocket } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";

function Batch() {
  const [formData, setFormData] = useState({
    batch_name: "",
    course_id: "",
    branch_id: "",
    start_date: "",
    end_date: "",
    batch_start_time: "",
    batch_end_time: "",
    student_limit: "",
  });
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  // Fetch all courses for the user's branch only
  const fetchCourses = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Update selected course when course is selected
    if (name === "course_id") {
      const course = courses.find(c => c.id === parseInt(value));
      setSelectedCourse(course);
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // Prepare payload with user's branch_id and time fields
      const payload = {
        ...formData,
        branch_id: userBranchId,
      };
      
      await axios.post("/batches/create", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("🎉 Batch created successfully!");
      
      // Reset form
      setFormData({
        batch_name: "",
        course_id: "",
        branch_id: "",
        start_date: "",
        end_date: "",
        batch_start_time: "",
        batch_end_time: "",
        student_limit: "",
      });
      setSelectedCourse(null);
    } catch (error) {
      console.error(error);
      toast.error("❌ Error creating batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        theme="colored"
      />
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 font-nunito bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Create New Batch
        </h1>
        <p className="text-gray-600 text-lg">
          Start a new learning journey for your students
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* Main Form Card */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl">
              <FaRocket className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Batch Information</h2>
              <p className="text-gray-500">Fill in the details to create a new batch</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Batch Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaUserFriends className="text-blue-500" />
                Batch Name *
              </label>
              <input
                type="text"
                name="batch_name"
                value={formData.batch_name}
                onChange={handleChange}
                required
                placeholder="Enter batch name (e.g., Morning Batch 2024)"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              />
            </div>

            {/* Course Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaBook className="text-green-500" />
                Select Course *
              </label>
              {courses.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-yellow-700">
                    No courses available for your branch. Please create a course first.
                  </p>
                </div>
              ) : (
                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                >
                  <option value="">-- Choose a Course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name} - {course.course_level} ({course.mode})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date and Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaCalendarAlt className="text-purple-500" />
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaCalendarAlt className="text-red-500" />
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaClock className="text-blue-500" />
                  Start Time *
                </label>
                <input
                  type="time"
                  name="batch_start_time"
                  value={formData.batch_start_time}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaClock className="text-green-500" />
                  End Time *
                </label>
                <input
                  type="time"
                  name="batch_end_time"
                  value={formData.batch_end_time}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Student Limit */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FaUsers className="text-orange-500" />
                Student Limit *
              </label>
              <input
                type="number"
                name="student_limit"
                value={formData.student_limit}
                onChange={handleChange}
                required
                min="1"
                max="100"
                placeholder="Maximum number of students"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500">Recommended: 20-30 students for optimal learning</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || courses.length === 0}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                loading || courses.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
              } text-white flex items-center justify-center gap-3`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Batch...
                </>
              ) : (
                <>
                  <FaPlus />
                  Create Batch
                </>
              )}
            </button>
          </form>
        </div>

        {/* Side Information Panel */}
        <div className="lg:w-96 space-y-6">
          {/* Selected Course Preview */}
          {selectedCourse && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaGraduationCap className="text-blue-500" />
                Selected Course
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Course Name:</span>
                  <span className="font-semibold text-gray-800">{selectedCourse.course_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Level:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedCourse.course_level === "Beginner" ? "bg-green-100 text-green-800" :
                    selectedCourse.course_level === "Intermediate" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {selectedCourse.course_level}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mode:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedCourse.mode === "Online" ? "bg-blue-100 text-blue-800" :
                    selectedCourse.mode === "Offline" ? "bg-purple-100 text-purple-800" :
                    "bg-teal-100 text-teal-800"
                  }`}>
                    {selectedCourse.mode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{selectedCourse.duration} months</span>
                </div>
              </div>
            </div>
          )}

          {/* Batch Creation Tips */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaRocket className="text-yellow-300" />
              Pro Tips
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-white/20 rounded-full p-1 mt-1">💡</span>
                <span>Choose a descriptive batch name for easy identification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 rounded-full p-1 mt-1">⏰</span>
                <span>Ensure time slots don't overlap with existing batches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 rounded-full p-1 mt-1">👥</span>
                <span>Set realistic student limits for better learning experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 rounded-full p-1 mt-1">📅</span>
                <span>Plan dates considering holidays and important events</span>
              </li>
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Batch Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-xl">
                <FaUsers className="text-blue-500 text-2xl mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">0</p>
                <p className="text-xs text-gray-600">Active Batches</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <FaGraduationCap className="text-green-500 text-2xl mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{courses.length}</p>
                <p className="text-xs text-gray-600">Available Courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Batch;