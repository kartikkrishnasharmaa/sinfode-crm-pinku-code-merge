import { useEffect, useState, useRef } from "react";
import axios from "../../../api/axiosConfig";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

export default function AssignmentTable() {
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [studentStatuses, setStudentStatuses] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

  const dropdownRef = useRef(null);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    submit_date: "",
    staff_id: "",
    course_id: "",
    batch_id: "",
    branch_id: userBranchId || "",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/assignments/show", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = res.data.data || res.data;
      if (!Array.isArray(data)) {
        data = [];
      }

      // Filter assignments by user's branch_id
      if (userBranchId) {
        data = data.filter(
          (assignment) => assignment.branch_id == userBranchId
        );
      }

      console.log("Final assignments data:", data);
      setAssignments(data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staff (filter by user's branch if needed)
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let staffData = res.data || [];
      if (userBranchId) {
        staffData = staffData.filter(
          (staff) => staff.branch_id == userBranchId
        );
      }

      setStaffList(staffData);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  // Fetch branches
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

  // Fetch courses (filter by user's branch if needed)
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/courses/index", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let coursesData = res.data || [];
      if (userBranchId) {
        coursesData = coursesData.filter(
          (course) => course.branch_id == userBranchId
        );
      }

      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // Fetch batches (filter by user's branch if needed)
  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/batches/show", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let batchesData = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];

      if (userBranchId) {
        batchesData = batchesData.filter(
          (batch) => batch.branch_id == userBranchId
        );
      }

      setBatches(batchesData);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  // Fetch assignment submissions
  const fetchAssignmentSubmissions = async (assignmentId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const assignmentData = res.data;
      setSubmissions(assignmentData.submissions || []);

      const initialStatuses = {};
      (assignmentData.submissions || []).forEach(submission => {
        // Normalize status values to match backend expectations
        let status = submission.status || "Pending";
        // Convert any status that's not "Done" to "Pending"
        if (status !== "Done") {
          status = "Pending";
        }
        initialStatuses[submission.student_id] = status;
      });

      setStudentStatuses(initialStatuses);
      return assignmentData;
    } catch (error) {
      console.error("Error fetching assignment submissions:", error);
      return { submissions: [] };
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchStaff();
    fetchBranches();
    fetchCourses();
    fetchBatches();
  }, []);

  // Handle Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit Assignment
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/assignments", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message || "Assignment created successfully");
      setShowModal(false);
      setFormData({
        title: "",
        description: "",
        submit_date: "",
        staff_id: "",
        course_id: "",
        batch_id: "",
        branch_id: userBranchId || "",
      });

      fetchAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Error creating assignment");
    }
  };

  // Open review modal
  const handleReviewClick = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowReviewModal(true);
    setReviewLoading(true);

    try {
      await fetchAssignmentSubmissions(assignment.id);
    } catch (error) {
      console.error("Error loading review data:", error);
    } finally {
      setReviewLoading(false);
    }
  };

  // Open details modal
  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  // Handle student status change
  const handleStatusChange = (studentId, status) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Submit bulk status updates
  const handleBulkStatusUpdate = async () => {
    try {
      const token = localStorage.getItem("token");

      const updates = Object.keys(studentStatuses).map(studentId => ({
        student_id: parseInt(studentId),
        status: studentStatuses[studentId]
      }));

      const payload = {
        assignment_id: selectedAssignment.id,
        updates: updates
      };

      console.log("Sending bulk update payload:", payload);

      const res = await axios.put("/assignments/submissions/bulk-update", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(res.data.message || "Statuses updated successfully");
      setShowReviewModal(false);
      fetchAssignments();
    } catch (error) {
      console.error("Error updating statuses:", error);
      if (error.response) {
        console.error("Backend validation errors:", error.response.data.errors);
        toast.error(`Error: ${error.response.data.message || "Invalid status value"}`);
      } else {
        toast.error("Error updating statuses");
      }
    }
  };

  // Handle delete assignment
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`/assignments/delete/${assignmentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(res.data.message || "Assignment deleted successfully");
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
      setOpenDropdown(null);
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Error deleting assignment");
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  // Toggle dropdown menu
  const toggleDropdown = (assignmentId) => {
    setOpenDropdown(openDropdown === assignmentId ? null : assignmentId);
  };

  // Submit Single Student Update (Bulk for all pending)
  const handleBulkSubmit = async (assignment) => {
    try {
      const token = localStorage.getItem("token");
      
      // Get all students in the batch who haven't submitted yet
      const pendingUpdates = [];
      
      if (assignment.submissions && assignment.submissions.length > 0) {
        assignment.submissions.forEach(submission => {
          if (submission.status !== "Done") {
            pendingUpdates.push({
              student_id: submission.student_id,
              status: "Done"
            });
          }
        });
      }

      if (pendingUpdates.length === 0) {
        toast.info("No pending submissions to update");
        return;
      }

      const payload = {
        assignment_id: assignment.id,
        updates: pendingUpdates
      };

      const res = await axios.put("/assignments/submissions/bulk-update", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(res.data.message || "Submissions updated successfully");
      fetchAssignments(); // Refresh assignments to update status
    } catch (error) {
      console.error("Error updating submissions:", error);
      toast.error("Error updating submissions");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get submission status text and color
  const getSubmissionStatus = (assignment) => {
    if (!assignment.submissions || assignment.submissions.length === 0) {
      return { text: "No Submissions", color: "bg-gray-100 text-gray-700" };
    }

    const total = assignment.submissions.length;
    const completed = assignment.submissions.filter(s => s.status === "Done").length;

    if (completed === 0) {
      return { text: "Pending", color: "bg-yellow-100 text-yellow-700" };
    } else if (completed === total) {
      return { text: "Completed", color: "bg-green-100 text-green-700" };
    } else {
      return { text: `${completed}/${total} Submitted`, color: "bg-blue-100 text-blue-700" };
    }
  };

  const getAssignmentDetails = (assignment) => {
    return {
      branchName: assignment.branch?.branch_name || `Branch ID: ${assignment.branch_id || "-"}`,
      courseName: assignment.course?.course_name || `Course ID: ${assignment.course_id || "-"}`,
      batchName: assignment.batch?.batch_name || `Batch ID: ${assignment.batch_id || "-"}`,
      teacherName: assignment.teacher?.employee_name || `Staff ID: ${assignment.staff_id || "-"}`
    };
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} days`, color: 'text-red-600', bg: 'bg-red-50' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600', bg: 'bg-orange-50' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-orange-600', bg: 'bg-orange-50' };
    } else {
      return { text: `${diffDays} days remaining`, color: 'text-green-600', bg: 'bg-green-50' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
        <div className="text-lg text-gray-600">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Header with Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-gray-600">Manage and review student assignments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          New Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Total Assignments</h3>
          <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Pending Review</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {assignments.filter(a => getSubmissionStatus(a).text === "Pending").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
          <p className="text-2xl font-bold text-green-600">
            {assignments.filter(a => getSubmissionStatus(a).text === "Completed").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">In Progress</h3>
          <p className="text-2xl font-bold text-blue-600">
            {assignments.filter(a => getSubmissionStatus(a).text.includes("/")).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p className="text-lg font-medium text-gray-600">No assignments found</p>
                      <p className="text-gray-500">Create your first assignment to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assignments.map((assignment, index) => {
                  const details = getAssignmentDetails(assignment);
                  const status = getSubmissionStatus(assignment);

                  return (
                    <tr
                      key={assignment.id}
                      className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => handleViewDetails(assignment)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {assignment.title.length > 20
                              ? assignment.title.slice(0, 20) + "..."
                              : assignment.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {assignment.description.length > 50
                              ? assignment.description.slice(0, 50) + "..."
                              : assignment.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{formatDate(assignment.submit_date)}</div>
                        <div className={`text-xs font-medium ${new Date(assignment.submit_date) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                          {new Date(assignment.submit_date) < new Date() ? 'Overdue' : 'Active'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {assignment.submissions ? assignment.submissions.length : 0} students
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2 items-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="text-white bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md font-medium text-sm transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBulkSubmit(assignment);
                            }}
                          >
                            SUBMIT
                          </button>

                          {/* Dropdown Menu */}
                          <div className="relative" ref={dropdownRef}>
                            <button
                              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(assignment.id);
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                              </svg>
                            </button>

                            {openDropdown === assignment.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(assignment);
                                    setOpenDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors duration-200 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReviewClick(assignment);
                                    setOpenDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors duration-200 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                  </svg>
                                  Review Submissions
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(assignment);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                  Delete Assignment
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Create Assignment</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Assignment title"
                  value={formData.title}
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  placeholder="Assignment description"
                  value={formData.description}
                  rows="3"
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  name="submit_date"
                  value={formData.submit_date}
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select
                    name="course_id"
                    value={formData.course_id}
                    className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                    <select
                      name="batch_id"
                      value={formData.batch_id}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Batch</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                    <select
                      name="staff_id"
                      value={formData.staff_id}
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Staff</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.employee_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Details Modal */}
      {showDetailsModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Assignment Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedAssignment.title}</h1>
                    <p className="text-gray-600 text-lg">{selectedAssignment.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getDaysRemaining(selectedAssignment.submit_date).bg} ${getDaysRemaining(selectedAssignment.submit_date).color}`}>
                      {getDaysRemaining(selectedAssignment.submit_date).text}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment Information */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Assignment Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Due Date:</span>
                        <span className="text-gray-900">{formatDate(selectedAssignment.submit_date)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Created:</span>
                        <span className="text-gray-900">{formatDate(selectedAssignment.created_at)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Last Updated:</span>
                        <span className="text-gray-900">{formatDate(selectedAssignment.updated_at)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-600">Submissions:</span>
                        <span className="text-gray-900">{selectedAssignment.submissions?.length || 0} students</span>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Teacher Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Name:</span>
                        <span className="text-gray-900">{selectedAssignment.teacher?.employee_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Email:</span>
                        <span className="text-gray-900">{selectedAssignment.teacher?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Contact:</span>
                        <span className="text-gray-900">{selectedAssignment.teacher?.contact_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-600">Department:</span>
                        <span className="text-gray-900">{selectedAssignment.teacher?.department || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course & Batch Information */}
                <div className="space-y-6">
                  {/* Course Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      Course Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Course Name:</span>
                        <span className="text-gray-900">{selectedAssignment.course?.course_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Course Code:</span>
                        <span className="text-gray-900">{selectedAssignment.course?.course_code || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Duration:</span>
                        <span className="text-gray-900">{selectedAssignment.course?.duration || 'N/A'} months</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Mode:</span>
                        <span className="text-gray-900">{selectedAssignment.course?.mode || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-600">Level:</span>
                        <span className="text-gray-900">{selectedAssignment.course?.course_level || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      Batch Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Batch Name:</span>
                        <span className="text-gray-900">{selectedAssignment.batch?.batch_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Start Date:</span>
                        <span className="text-gray-900">{formatDate(selectedAssignment.batch?.start_date)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">End Date:</span>
                        <span className="text-gray-900">{formatDate(selectedAssignment.batch?.end_date)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-600">Batch Time:</span>
                        <span className="text-gray-900">
                          {formatTime(selectedAssignment.batch?.batch_start_time)} - {formatTime(selectedAssignment.batch?.batch_end_time)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-600">Student Limit:</span>
                        <span className="text-gray-900">{selectedAssignment.batch?.student_limit || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Branch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Branch Name:</span>
                      <span className="text-gray-900">{selectedAssignment.branch?.branch_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Branch Code:</span>
                      <span className="text-gray-900">{selectedAssignment.branch?.branch_code || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Address:</span>
                      <span className="text-gray-900 text-right">{selectedAssignment.branch?.address || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">City:</span>
                      <span className="text-gray-900">{selectedAssignment.branch?.city || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">State:</span>
                      <span className="text-gray-900">{selectedAssignment.branch?.state || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-600">Contact:</span>
                      <span className="text-gray-900">{selectedAssignment.branch?.contact_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Submissions Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  Student Submissions
                  <span className="ml-2 bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {selectedAssignment.submissions?.length || 0}
                  </span>
                </h3>

                {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedAssignment.submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={submission.student.photo_url || '/default-avatar.png'}
                            alt={submission.student.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{submission.student.full_name}</h4>
                            <p className="text-sm text-gray-500 truncate">Admission: {submission.student.admission_number}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Status</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${submission.status === 'Done'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {submission.status}
                            </span>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500">Submitted</span>
                            <span className="text-sm text-gray-900">
                              {formatDate(submission.updated_at)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Contact: {submission.student.contact_number}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="mt-2 text-gray-500">No submissions yet</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleReviewClick(selectedAssignment);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                  </svg>
                  Review Submissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Review Submissions - {selectedAssignment?.title}
              </h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {reviewLoading ? (
              <div className="py-8 text-center text-gray-500">Loading student data...</div>
            ) : (
              <>
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-gray-700">
                    <span className="font-semibold">Due Date:</span> {selectedAssignment ? formatDate(selectedAssignment.submit_date) : ''}
                  </p>
                  <p className="text-gray-700 mt-1">
                    <span className="font-semibold">Total Submissions:</span> {submissions.length} students
                  </p>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                              <p>No submissions found for this assignment.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        submissions.map((submission) => (
                          <tr key={submission.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 font-medium text-gray-900">{submission.student.id}</td>
                            <td className="px-4 py-3">
                              {submission.student.full_name}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={studentStatuses[submission.student_id] || "Pending"}
                                onChange={(e) => handleStatusChange(submission.student_id, e.target.value)}
                                className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Done">Done</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkStatusUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    Update Status
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Delete Assignment</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <span className="text-red-800 font-medium">Warning: This action cannot be undone</span>
                </div>
              </div>
              <p className="text-gray-600">
                Are you sure you want to delete the assignment <span className="font-semibold">"{assignmentToDelete?.title}"</span>?
                All associated submissions will also be permanently deleted.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAssignment}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Delete Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}