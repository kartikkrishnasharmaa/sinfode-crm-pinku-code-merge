import React, { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const ExamForm = ({ formData, setFormData, setShowModal, refreshData }) => {
  const [calculatedValues, setCalculatedValues] = useState({
    percentage: 0,
    grade: "-",
    gradeColor: "text-gray-600",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  // Fetch all branches (for reference only)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/branches", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Branches API response:", res);
        setBranches(res.data || []);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranches();
  }, []);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/courses/index", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data || [];
        console.log("Fetched courses:", data);
        setCourses(data);
        
        // Filter courses by user's branch
        if (userBranchId) {
          const filtered = data.filter(
            (course) => course.branch_id?.toString() === userBranchId.toString()
          );
          console.log("Filtered courses by branch:", filtered);
          setFilteredCourses(filtered);
        } else {
          setFilteredCourses(data);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, [userBranchId]);

  // Fetch all batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/batches/show", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Handle different possible response structures
        let batchesData = [];

        if (Array.isArray(res.data)) {
          batchesData = res.data;
        } else if (res.data && Array.isArray(res.data.batches)) {
          batchesData = res.data.batches;
        } else if (res.data && Array.isArray(res.data.data)) {
          batchesData = res.data.data;
        } else {
          console.warn("Unexpected batches API response structure:", res.data);
          batchesData = [];
        }

        console.log("Fetched batches:", batchesData);
        setBatches(batchesData);
        
        // Filter batches by user's branch
        if (userBranchId) {
          const filtered = batchesData.filter(
            (batch) => batch.branch_id?.toString() === userBranchId.toString()
          );
          console.log("Filtered batches by branch:", filtered);
          setFilteredBatches(filtered);
        } else {
          setFilteredBatches(batchesData);
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
        setBatches([]);
      }
    };
    fetchBatches();
  }, [userBranchId]);

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/students/show", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let studentsData = [];
        
        if (Array.isArray(res.data)) {
          studentsData = res.data;
        } else if (res.data && Array.isArray(res.data.students)) {
          studentsData = res.data.students;
        } else if (res.data && Array.isArray(res.data.data)) {
          studentsData = res.data.data;
        } else {
          console.warn("Unexpected students API response structure:", res.data);
          studentsData = [];
        }
        
        console.log("Fetched students:", studentsData);
        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudents([]);
      }
    };

    fetchStudents();
  }, []);

  // Filter students by branch and batch
  useEffect(() => {
    console.log("Filtering students with:", {
      userBranchId,
      selectedBatch,
      studentsCount: students.length
    });

    let filtered = students;

    // Filter by branch
    if (userBranchId) {
      filtered = filtered.filter(
        (student) => student.branch_id?.toString() === userBranchId.toString()
      );
    }

    // Filter by batch - check courses array for batch_id in pivot
    if (selectedBatch) {
      filtered = filtered.filter((student) => {
        // Check if student has any course with the selected batch_id in pivot
        return student.courses?.some(
          (course) => course.pivot?.batch_id?.toString() === selectedBatch
        );
      });
    }

    console.log("Filtered students:", filtered);
    setFilteredStudents(filtered);
  }, [userBranchId, selectedBatch, students]);

  // Filter courses by selected batch
  useEffect(() => {
    if (selectedBatch) {
      // Find the batch to get its course_id
      const selectedBatchObj = batches.find(batch => batch.id.toString() === selectedBatch);
      if (selectedBatchObj && selectedBatchObj.course_id) {
        // Filter courses to show only the course associated with this batch
        const filtered = courses.filter(
          (course) => course.id.toString() === selectedBatchObj.course_id.toString()
        );
        console.log("Filtered courses by batch:", filtered);
        setFilteredCourses(filtered);
        
        // Auto-select the course if only one is available
        if (filtered.length === 1) {
          setSelectedCourse(filtered[0].id.toString());
          setFormData((prev) => ({
            ...prev,
            course: filtered[0].id.toString(),
          }));
        }
      } else {
        // If batch doesn't have course_id, show all courses for the branch
        const filtered = courses.filter(
          (course) => !userBranchId || course.branch_id?.toString() === userBranchId.toString()
        );
        setFilteredCourses(filtered);
      }
    } else {
      // When no batch is selected, show all courses for the branch
      const filtered = courses.filter(
        (course) => !userBranchId || course.branch_id?.toString() === userBranchId.toString()
      );
      setFilteredCourses(filtered);
    }
  }, [selectedBatch, batches, courses, userBranchId, setFormData]);

  // Set the user's branch in form data on component mount
  useEffect(() => {
    if (userBranchId) {
      setFormData((prev) => ({
        ...prev,
        branch: userBranchId.toString(),
      }));
    }
  }, [userBranchId, setFormData]);

  // Update calculations when marks change
  useEffect(() => {
    updateCalculations();
  }, [formData.totalMarks, formData.obtainedMarks]);

  const updateCalculations = () => {
    const totalMarks = parseFloat(formData.totalMarks) || 0;
    const obtainedMarks = parseFloat(formData.obtainedMarks) || 0;

    if (totalMarks > 0) {
      const percentage = (obtainedMarks / totalMarks) * 100;

      let grade = "F";
      let gradeColor = "text-red-600";

      if (percentage >= 90) {
        grade = "A+";
        gradeColor = "text-green-600";
      } else if (percentage >= 80) {
        grade = "A";
        gradeColor = "text-green-600";
      } else if (percentage >= 70) {
        grade = "B";
        gradeColor = "text-blue-600";
      } else if (percentage >= 60) {
        grade = "C";
        gradeColor = "text-yellow-600";
      } else if (percentage >= 50) {
        grade = "D";
        gradeColor = "text-orange-600";
      }

      setCalculatedValues({
        percentage,
        grade,
        gradeColor,
      });
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedBatch("");
    setSelectedCourse("");
    setFormData({
      studentId: "",
      branch: userBranchId ? userBranchId.toString() : "",
      batch: "",
      course: "",
      examDate: "",
      examName: "",
      totalMarks: 100,
      obtainedMarks: 0,
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    setSelectedBatch(batchId);
    setFormData((prev) => ({
      ...prev,
      batch: batchId,
      course: "", // Reset course when batch changes
    }));
    setSelectedCourse(""); // Reset selected course
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setFormData((prev) => ({
      ...prev,
      course: courseId,
    }));
  };

  const handleStudentSelect = (e) => {
    const studentId = e.target.value;
    const student = filteredStudents.find((s) => s.id.toString() === studentId);

    if (student) {
      setFormData((prev) => ({
        ...prev,
        studentId: student.id.toString(),
        studentName: student.full_name,
      }));
    }
  };

  // Handle form submission to API
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (formData.obtainedMarks > formData.totalMarks) {
      toast.error("Obtained marks cannot be greater than total marks!");
      return;
    }

    if (!formData.course) {
      toast.error("Please select a course!");
      return;
    }

    if (!formData.studentId) {
      toast.error("Please select a student!");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      // Prepare the data for API - including course_id
      const apiData = {
        student_id: parseInt(formData.studentId),
        batch_id: parseInt(formData.batch),
        branch_id: parseInt(formData.branch), // This will now use the user's branch_id
        course_id: parseInt(formData.course),
        exam_type: formData.examName,
        marks_obtained: parseFloat(formData.obtainedMarks),
        total_marks: parseFloat(formData.totalMarks),
        exam_date: formData.examDate,
      };

      console.log("Submitting exam data:", apiData);

      const response = await axios.post("/exam-marks", apiData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Exam marks recorded successfully!");

        // Refresh the data in parent component
        if (refreshData) {
          refreshData();
        }

        resetForm();
      }
    } catch (error) {
      console.error("Error submitting exam marks:", error);
      toast.error("Failed to record exam marks. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to handle input focus
  const handleFocus = (e) => {
    e.target.style.borderColor = "#0176d3";
    e.target.style.boxShadow = "0 0 0 2px rgba(1, 118, 211, 0.1)";
  };

  // Helper function to handle input blur
  const handleBlur = (e) => {
    e.target.style.borderColor = "#dddbda";
    e.target.style.boxShadow = "none";
  };

  // Helper function for button hover effects
  const handleButtonHover = (e) => {
    e.target.style.background = "#005fb2";
    e.target.style.transform = "translateY(-1px)";
  };

  // Helper function for button mouse out
  const handleButtonOut = (e) => {
    e.target.style.background = "#0176d3";
    e.target.style.transform = "translateY(0)";
  };

  // Get student's course and batch info for display
  const getStudentInfo = (student) => {
    if (!student.courses || student.courses.length === 0) {
      return "No course assigned";
    }
    
    const course = student.courses[0]; // Get first course
    return `${course.course_name} - ${course.batch?.batch_name || 'No batch'}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
        <div
          className="sf-blue text-white px-6 py-4 rounded-t-lg"
          style={{
            background: "linear-gradient(135deg, #0176d3 0%, #005fb2 100%)",
          }}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Add Exam Marks</h3>
            <button
              onClick={resetForm}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-800 border-b pb-2">
                Student Information
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch
                </label>
                <select
                  id="batch"
                  required
                  value={selectedBatch}
                  onChange={handleBatchChange}
                  className="w-full px-4 py-3 sf-input rounded-lg focus:outline-none"
                  style={{
                    border: "1px solid #dddbda",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="">Select Batch</option>
                  {filteredBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  id="course"
                  required
                  value={selectedCourse}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-3 sf-input rounded-lg focus:outline-none"
                  style={{
                    border: "1px solid #dddbda",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  disabled={!selectedBatch}
                >
                  <option value="">Select Course</option>
                  {filteredCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
                {selectedBatch && filteredCourses.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    No courses found for this batch. Please select a batch that has associated courses.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <select
                  id="student"
                  required
                  onChange={handleStudentSelect}
                  className="w-full px-4 py-3 sf-input rounded-lg focus:outline-none"
                  style={{
                    border: "1px solid #dddbda",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  disabled={!selectedBatch}
                >
                  <option value="">Select Student</option>
                  {filteredStudents.length === 0 && selectedBatch ? (
                    <option value="" disabled>
                      No students found in this batch
                    </option>
                  ) : (
                    filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} 
                        {student.courses && student.courses.length > 0 && (
                          <span className="text-gray-500 text-sm">
                            {" "}
                            ({getStudentInfo(student)})
                          </span>
                        )}
                      </option>
                    ))
                  )}
                </select>
                {selectedBatch && filteredStudents.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No students found in the selected batch. Please check if students are enrolled in courses with this batch.
                  </p>
                )}
              </div>
            </div>

            {/* Exam Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-800 border-b pb-2">
                Exam Information
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Date
                </label>
                <input
                  type="date"
                  id="examDate"
                  required
                  value={formData.examDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sf-input rounded-lg focus:outline-none"
                  style={{
                    border: "1px solid #dddbda",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Name/Type
                </label>
                <input
                  type="text"
                  id="examName"
                  required
                  value={formData.examName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sf-input rounded-lg focus:outline-none"
                  style={{
                    border: "1px solid #dddbda",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="e.g., Mid Term, Final Exam"
                />
              </div>
            </div>

            {/* Marks Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-800 border-b pb-2">
                Marks Information
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks
                </label>
                <input
                  type="number"
                  id="totalMarks"
                  required
                  min="1"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sf-input rounded-lg focus:outline-none"
                  style={{
                    border: "1px solid #dddbda",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Enter total marks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Obtained Marks
                </label>
                <input
                  type="number"
                  id="obtainedMarks"
                  required
                  min="0"
                  value={formData.obtainedMarks}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sf-input rounded-lg focus:outline-none"
                  style={{
                    border: "1px solid #dddbda",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Enter obtained marks"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  Calculated Results:
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Percentage:</span>
                    <span className="text-sm font-bold text-blue-600">
                      {calculatedValues.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Grade:</span>
                    <span
                      className={`text-sm font-bold ${calculatedValues.gradeColor}`}
                    >
                      {calculatedValues.grade}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sf-button text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2"
              style={{
                background: "#0176d3",
                transition: "all 0.2s ease",
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseOver={isSubmitting ? undefined : handleButtonHover}
              onMouseOut={isSubmitting ? undefined : handleButtonOut}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Save Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamForm;