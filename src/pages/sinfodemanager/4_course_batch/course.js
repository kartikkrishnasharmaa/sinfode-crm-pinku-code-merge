import SMLayout from "../../../layouts/Sinfodemanager";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { FaEdit, FaTrash, FaEye, FaPlus, FaBook, FaList, FaUsers, FaRupeeSign, FaClock, FaLayerGroup } from "react-icons/fa";
import Batch from "./batch";
import Allbatch from "./allbatch";  

function AllCourse() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/courses/index", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      const userBranchCourses = data.filter(course => 
        course.branch_id === userBranchId
      );
      setCourses(userBranchCourses);
      setFilteredCourses(userBranchCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

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

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        course_name: formData.course_name,
        discounted_price: formData.discounted_price,
        actual_price: formData.actual_price,
      };

      await axios.put(`/courses/${selectedCourse.id}/update`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Course updated successfully!");
      setModalType("");
      fetchCourses();
    } catch (error) {
      console.error("Update failed:", error.response?.data || error);
      alert("❌ Update failed!");
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/courses/${selectedCourse.id}/destroy`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Course deleted successfully!");
      setModalType("");
      fetchCourses();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed!");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const filtered = courses.filter(course =>
      course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 font-nunito">
          Course Management
        </h1>
        <p className="text-gray-600 text-lg">
          Manage and monitor all your courses in one place
        </p>
      </div>

      {/* Search and Stats Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FaBook className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{filteredCourses.length}</h3>
              <p className="text-gray-600">Total Courses</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <FaList className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">No Courses Found</h3>
          <p className="text-gray-500">Get started by creating your first course</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
            >
              {/* Course Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    course.course_level === "Beginner" ? "bg-green-500" :
                    course.course_level === "Intermediate" ? "bg-yellow-500" : "bg-red-500"
                  }`}>
                    {course.course_level}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold bg-white ${
                    course.mode === "Online" ? "text-blue-600" :
                    course.mode === "Offline" ? "text-purple-600" : "text-teal-600"
                  }`}>
                    {course.mode}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2 line-clamp-2">{course.course_name}</h3>
                <p className="text-blue-100 opacity-90 flex items-center gap-2">
                  <FaLayerGroup />
                  {course.course_category}
                </p>
              </div>

              {/* Course Body */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <FaClock className="text-blue-500" />
                    <span>{course.duration} months</span>
                  </div>
                  
                  {course.branch && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <FaUsers className="text-green-500" />
                      <span>{course.branch.branch_name} ({course.branch.city})</span>
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
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                    title="View Details"
                  >
                    <FaEye size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced View Modal */}
      {modalType === "view" && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Course Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-xl">
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

                <div className="bg-green-50 p-4 rounded-xl">
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

                <div className="bg-purple-50 p-4 rounded-xl">
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

                <div className="bg-orange-50 p-4 rounded-xl">
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
                  <div className="bg-teal-50 p-4 rounded-xl">
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
                  <div className="bg-pink-50 p-4 rounded-xl">
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
                        className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-all duration-200"
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
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalType === "edit" && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Edit Course</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name</label>
                <input
                  type="text"
                  value={formData.course_name || ""}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Discounted Price (₹)</label>
                <input
                  type="number"
                  value={formData.discounted_price || ""}
                  onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Actual Price (₹)</label>
                <input
                  type="number"
                  value={formData.actual_price || ""}
                  onChange={(e) => setFormData({ ...formData, actual_price: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setModalType("")}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                Update Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Confirm Delete</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <FaTrash className="text-red-500 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-700 font-semibold">
                    Are you sure you want to delete this course?
                  </p>
                  <p className="text-gray-600 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setModalType("")}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                Delete Course
              </button>
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
      <div className="flex h-full bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Enhanced Sidebar */}
        <div className="w-80 bg-white rounded-2xl shadow-xl m-4 p-6 space-y-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Center</h2>
            <p className="text-gray-600">Manage your learning programs</p>
          </div>
          
          <button
            onClick={() => setActiveTab("courseList")}
            className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-4 ${
              activeTab === "courseList"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform -translate-y-1"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md"
            }`}
          >
            <div className={`p-3 rounded-xl ${
              activeTab === "courseList" ? "bg-white/20" : "bg-blue-100 text-blue-600"
            }`}>
              <FaList className="text-lg" />
            </div>
            <div>
              <div className="font-semibold">All Courses</div>
              <div className="text-sm opacity-80">Browse all courses</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("batchManagement")}
            className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-4 ${
              activeTab === "batchManagement"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform -translate-y-1"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md"
            }`}
          >
            <div className={`p-3 rounded-xl ${
              activeTab === "batchManagement" ? "bg-white/20" : "bg-green-100 text-green-600"
            }`}>
              <FaPlus className="text-lg" />
            </div>
            <div>
              <div className="font-semibold">Add Batches</div>
              <div className="text-sm opacity-80">Create new batches</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("allBatches")}
            className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center gap-4 ${
              activeTab === "allBatches"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform -translate-y-1"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md"
            }`}
          >
            <div className={`p-3 rounded-xl ${
              activeTab === "allBatches" ? "bg-white/20" : "bg-purple-100 text-purple-600"
            }`}>
              <FaUsers className="text-lg" />
            </div>
            <div>
              <div className="font-semibold">All Batches</div>
              <div className="text-sm opacity-80">Manage all batches</div>
            </div>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 rounded-2xl m-4 overflow-hidden">
          {activeTab === "courseList" && <AllCourse />}
          {activeTab === "batchManagement" && <Batch />}
          {activeTab === "allBatches" && <Allbatch />}
        </div>
      </div>
    </SMLayout>
  );
}