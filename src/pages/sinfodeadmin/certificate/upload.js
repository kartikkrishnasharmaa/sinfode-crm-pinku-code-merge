import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSearch,
  FaFilter,
  FaUpload,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Allstudents() {
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [certificateNumber, setCertificateNumber] = useState("");


  // Filters
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [uploadCourse, setUploadCourse] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mobile filters visibility
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchBranches();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/students/show", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch students");
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
      toast.error("Failed to fetch branches");
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
      toast.error("Failed to fetch courses");
    }
  };

  // Get student's course for auto-selection
  const getStudentCourse = (student) => {
    // Assuming student has a course_id or courses array
    // Adjust based on your actual student data structure
    if (student.course_id) {
      return student.course_id;
    }
    if (student.courses && student.courses.length > 0) {
      return student.courses[0].id;
    }
    return "";
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesBranch =
      !selectedBranch || student.branch_id === parseInt(selectedBranch);

    const matchesCourse =
      !selectedCourse ||
      (student.course_id && student.course_id === parseInt(selectedCourse)) ||
      (student.courses && student.courses.some(c => c.id === parseInt(selectedCourse)));

    const matchesSearch =
      !search ||
      (student.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (student.student_id || "").toLowerCase().includes(search.toLowerCase());

    return matchesBranch && matchesCourse && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const openUploadModal = (student) => {
    setSelectedStudent(student);
    const studentCourseId = getStudentCourse(student);
    setUploadCourse(studentCourseId);
    setCertificateFile(null);
    setCertificateNumber(""); // 👈 NEW
    setShowUploadModal(true);
  };


  const handleUpload = async () => {
    if (!uploadCourse) {
      toast.error("Student is not enrolled in any course");
      return;
    }

    if (!certificateFile) {
      toast.error("Please select a PDF file");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("student_id", selectedStudent.id);
      formData.append("course_id", uploadCourse);
      formData.append("certificate_number", certificateNumber); // 👈 NEW

      formData.append("certificate_pdf", certificateFile);

      await axios.post("/admin/certificates/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Certificate uploaded successfully!");
      setShowUploadModal(false);
      setCertificateFile(null);
      setUploadCourse("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedBranch("");
    setSelectedCourse("");
    setSearch("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">


          {/* Desktop Filters */}
          <div className="hidden md:flex items-center space-x-4 mt-4 md:mt-0">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_name}
                </option>
              ))}
            </select>

            {(selectedBranch || selectedCourse || search) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg mt-4"
          >
            <FaFilter />
            <span>Filters</span>
          </button>
        </div>
        <div>

          <p className="text-gray-600 mt-1">
            {filteredStudents.length} students found
          </p>
        </div>
        {/* Mobile Filters Panel */}
        {showMobileFilters && (
          <div className="md:hidden bg-white p-4 rounded-lg shadow mb-4 space-y-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </div>

            {(selectedBranch || selectedCourse || search) && (
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 font-semibold text-gray-700">
          <div className="col-span-6 md:col-span-4 lg:col-span-4">Student</div>
          <div className="hidden lg:block ml-4 lg:col-span-4">Course</div>
          <div className="col-span-6 md:col-span-4 lg:col-span-4 text-center">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {currentStudents.length > 0 ? (
            currentStudents.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-12 gap-4 p-4 md:p-6 hover:bg-gray-50 transition-colors items-center"
              >
                {/* Student Info */}
                <div className="col-span-6 md:col-span-4 lg:col-span-4 flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={
                        student.photo_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          student.full_name || "Student"
                        )}&background=3F8CFF&color=fff`
                      }
                      alt={student.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {student.full_name}
                    </h3>

                  </div>
                </div>


                {/* Course - Hidden on mobile and tablet */}
                <div className="hidden lg:block lg:col-span-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {student.course?.course_name || student.courses?.[0]?.course_name || "N/A"}
                  </span>
                </div>
                {/* Certificate Number */}
            



                {/* Actions */}
                <div className="col-span-6 md:col-span-4 lg:col-span-4">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => openUploadModal(student)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow hover:shadow-md"
                    >
                      <FaUpload className="text-sm" />
                      <span className="hidden sm:inline">Upload Certificate</span>
                      <span className="sm:hidden">Upload</span>
                    </button>

                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No students found
              </h3>
              <p className="text-gray-500">
                {search || selectedBranch || selectedCourse
                  ? "Try adjusting your filters"
                  : "No students in the system yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaAngleDoubleLeft />
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronLeft />
            </button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg ${currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronRight />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaAngleDoubleRight />
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} • {filteredStudents.length} students
          </div>
        </div>
      )}

      {/* Upload Certificate Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">Upload Certificate</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={
                      selectedStudent?.photo_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        selectedStudent?.full_name || "Student"
                      )}&background=3F8CFF&color=fff`
                    }
                    alt={selectedStudent?.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {selectedStudent?.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedStudent?.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {selectedStudent?.branch?.branch_name || "N/A"}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        {courses.find(c => c.id === parseInt(uploadCourse))?.course_name || "Course not set"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Selection (Editable) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={uploadCourse}
                  onChange={(e) => setUploadCourse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  This is automatically set to the student's enrolled course
                </p>
              </div>
                  <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Number
                  </label>
                  <input
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    placeholder="Enter certificate number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate PDF
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                  {certificateFile ? (
                    <div className="space-y-2">
                      <div className="text-green-600 text-4xl">✓</div>
                      <p className="font-medium text-gray-700">
                        {certificateFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(certificateFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={() => setCertificateFile(null)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-400 text-4xl mb-2">📄</div>
                      <p className="text-gray-600 mb-2">
                        Drop your PDF here or click to browse
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Maximum file size: 10MB
                      </p>
                      <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                        Select File
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setCertificateFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadCourse || !certificateFile || !certificateNumber || loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >

                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    "Upload Certificate"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}