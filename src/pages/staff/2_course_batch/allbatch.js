import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { FaEye, FaEdit, FaTrash, FaUsers, FaCalendarAlt, FaClock, FaGraduationCap, FaBuilding, FaSearch, FaFilter, FaPlus, FaChartLine, FaUserFriends } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Allbatch() {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    course: "all",
    status: "all"
  });

  // Modal state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Editable fields
  const [editForm, setEditForm] = useState({
    batch_name: "",
    student_limit: "",
    start_date: "",
    end_date: "",
    batch_start_time: "",
    batch_end_time: "",
    course_id: "",
    branch_id: ""
  });

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  // Format time for display - handle database time format
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return "";
    
    // Handle different time formats from database
    let timeParts;
    if (timeString.includes('.')) {
      // Format: "16:21:00.000000"
      timeParts = timeString.split(':');
    } else {
      // Format: "16:21:00"
      timeParts = timeString.split(':');
    }
    
    if (timeParts.length < 2) return timeString;
    
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12 || 12;
    
    return `${hours}:${minutes} ${period}`;
  };

  // Format time for input field (convert to HH:MM format) - FIXED VERSION
  const formatTimeForInput = (timeString) => {
    if (!timeString) return "";
    
    // Extract hours and minutes from database format
    let hours, minutes;
    if (timeString.includes('.')) {
      // Format: "16:21:00.000000"
      const timeParts = timeString.split(':');
      hours = timeParts[0];
      minutes = timeParts[1];
    } else if (timeString.includes(':')) {
      // Format: "16:21:00" or "16:21"
      const timeParts = timeString.split(':');
      hours = timeParts[0];
      minutes = timeParts[1];
    } else {
      return timeString;
    }
    
    // Return in HH:MM format for input type="time"
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/batches/show", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Ensure it's always an array
      const batchList = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];

      setBatches(batchList);
      
      // Filter batches by user's branch
      const userBranchBatches = batchList.filter(batch => 
        batch.branch_id === userBranchId
      );
      
      setFilteredBatches(userBranchBatches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = batches.filter(batch => batch.branch_id === userBranchId);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.course?.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply course filter
    if (filters.course !== "all") {
      filtered = filtered.filter(batch => batch.course_id == filters.course);
    }

    // Apply status filter
    if (filters.status !== "all") {
      const today = new Date();
      if (filters.status === "active") {
        filtered = filtered.filter(batch => new Date(batch.start_date) <= today && new Date(batch.end_date) >= today);
      } else if (filters.status === "upcoming") {
        filtered = filtered.filter(batch => new Date(batch.start_date) > today);
      } else if (filters.status === "completed") {
        filtered = filtered.filter(batch => new Date(batch.end_date) < today);
      }
    }

    setFilteredBatches(filtered);
  }, [batches, searchTerm, filters, userBranchId]);

  useEffect(() => {
    fetchBatches();
  }, []);

  // Get batch status
  const getBatchStatus = (batch) => {
    const today = new Date();
    const startDate = new Date(batch.start_date);
    const endDate = new Date(batch.end_date);

    if (today < startDate) return { status: "Upcoming", color: "bg-blue-100 text-blue-800 border-blue-200" };
    if (today > endDate) return { status: "Completed", color: "bg-gray-100 text-gray-800 border-gray-200" };
    return { status: "Active", color: "bg-green-100 text-green-800 border-green-200" };
  };

  // View single batch
  const handleView = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/batches/show/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const batchData = res.data.data ? res.data.data : res.data;
      setSelectedBatch(batchData);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching batch:", error);
      toast.error("Failed to load batch details");
    }
  };

  // Open edit modal with data - FIXED TIME FORMAT
  const handleEdit = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/batches/show/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const batchData = res.data.data ? res.data.data : res.data;

      setSelectedBatch(batchData);
      setEditForm({
        batch_name: batchData.batch_name || "",
        student_limit: batchData.student_limit || "",
        start_date: batchData.start_date || "",
        end_date: batchData.end_date || "",
        // FIX: Use the correct time formatting function
        batch_start_time: formatTimeForInput(batchData.batch_start_time) || "",
        batch_end_time: formatTimeForInput(batchData.batch_end_time) || "",
        course_id: batchData.course_id || "",
        branch_id: batchData.branch_id || "",
        course_name: batchData.course?.course_name || ""
      });
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error loading batch for edit:", error);
      toast.error("Failed to load batch for editing");
    }
  };

  // Submit edit form - FIXED TIME FORMAT FOR BACKEND
  const handleUpdate = async (id) => {
    try {
      // Check for empty values
      if (!editForm.batch_name || !editForm.course_id || !editForm.start_date || 
          !editForm.end_date || !editForm.student_limit || !editForm.batch_start_time ||
          !editForm.batch_end_time) {
        toast.error("Please fill in all fields");
        return;
      }

      const token = localStorage.getItem("token");
      
      // FIX: Remove seconds from time format - backend expects H:i (16:21) not H:i:s (16:21:00)
      const updateData = {
        batch_name: editForm.batch_name.trim(),
        course_id: editForm.course_id,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        batch_start_time: editForm.batch_start_time, // Already in HH:MM format
        batch_end_time: editForm.batch_end_time, // Already in HH:MM format
        student_limit: parseInt(editForm.student_limit),
        branch_id: editForm.branch_id
      };
      
      console.log("Sending update data:", updateData); // Debug log
      
      const response = await axios.put(`/batches/update/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("✅ Batch updated successfully!");
      setIsEditModalOpen(false);
      fetchBatches();
    } catch (error) {
      console.error("Error updating batch:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        toast.error(`❌ Error: ${error.response.data.message || 'Update failed'}`);
      }
    }
  };

  // Delete batch
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/batches/destroy/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Batch deleted successfully!");
      fetchBatches();
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast.error("❌ Failed to delete batch");
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      course: "all",
      status: "all"
    });
  };

  // Get unique courses for filter
  const uniqueCourses = [...new Set(batches
    .filter(batch => batch.branch_id === userBranchId)
    .map(batch => ({ id: batch.course_id, name: batch.course?.course_name }))
  )].filter(course => course.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 font-nunito bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Batch Management
        </h1>
        <p className="text-gray-600 text-lg">
          Manage and monitor all your course batches
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Batches</p>
              <h3 className="text-3xl font-bold text-gray-800">{filteredBatches.length}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <FaUsers className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Batches</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {filteredBatches.filter(batch => getBatchStatus(batch).status === "Active").length}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <FaChartLine className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Upcoming Batches</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {filteredBatches.filter(batch => getBatchStatus(batch).status === "Upcoming").length}
              </h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <FaCalendarAlt className="text-yellow-600 text-2xl" />
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
                placeholder="Search batches by name or course..."
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
              className="px-4 py-3 border-2 bg-blue-500 border-gray-300 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
            >
              <FaFilter />
              Reset
            </button>
          </div>
        </div>

        {/* Filter Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Course</label>
            <select
              value={filters.course}
              onChange={(e) => setFilters({...filters, course: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-700">Loading batches...</h3>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">No Batches Found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={resetFilters}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {filteredBatches.map((batch, index) => {
            const status = getBatchStatus(batch);
            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Batch Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${status.color}`}>
                      {status.status}
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                      {batch.student_limit} Students
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{batch.batch_name}</h3>
                  <p className="text-blue-100 opacity-90 flex items-center gap-2">
                    <FaGraduationCap />
                    {batch.course?.course_name}
                  </p>
                </div>

                {/* Batch Body */}
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-600">
                      <FaBuilding className="text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Branch</p>
                        <p className="font-semibold">{batch.branch?.branch_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <FaCalendarAlt className="text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-semibold">
                          {batch.start_date} to {batch.end_date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <FaClock className="text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500">Timing</p>
                        <p className="font-semibold">
                          {formatTimeForDisplay(batch.batch_start_time)} - {formatTimeForDisplay(batch.batch_end_time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Enrollment</span>
                      <span>{batch.students?.length || 0} / {batch.student_limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${((batch.students?.length || 0) / batch.student_limit) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleView(batch.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
                      title="View Details"
                    >
                      <FaEye size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(batch.id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
                      title="Edit Batch"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(batch.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md"
                      title="Delete Batch"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced View Modal */}
      {isViewModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedBatch.batch_name}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {selectedBatch.course?.course_name}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getBatchStatus(selectedBatch).color}`}>
                      {getBatchStatus(selectedBatch).status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all duration-200 transform hover:scale-110"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Batch Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <FaGraduationCap className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Course</p>
                      <p className="font-semibold text-gray-800">{selectedBatch.course?.course_name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <FaBuilding className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Branch</p>
                      <p className="font-semibold text-gray-800">{selectedBatch.branch?.branch_name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <FaUsers className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Student Limit</p>
                      <p className="font-semibold text-gray-800">{selectedBatch.student_limit}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <FaCalendarAlt className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-800">
                        {selectedBatch.start_date} to {selectedBatch.end_date}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-teal-500 p-2 rounded-lg">
                      <FaClock className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Start Time</p>
                      <p className="font-semibold text-gray-800">
                        {formatTimeForDisplay(selectedBatch.batch_start_time)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-pink-500 p-2 rounded-lg">
                      <FaClock className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Time</p>
                      <p className="font-semibold text-gray-800">
                        {formatTimeForDisplay(selectedBatch.batch_end_time)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enrollment Status */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUsers className="text-green-500" />
                  Enrollment Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Enrollment</span>
                    <span className="font-semibold">{selectedBatch.students?.length || 0} students</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${((selectedBatch.students?.length || 0) / selectedBatch.student_limit) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{selectedBatch.students?.length || 0} enrolled</span>
                    <span>Capacity: {selectedBatch.student_limit}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-gray-50 rounded-b-3xl">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleEdit(selectedBatch.id)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
                >
                  <FaEdit />
                  Edit Batch
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Modal */}
      {isEditModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-8 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Edit Batch</h2>
                  <p className="text-yellow-100">Update batch information</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all duration-200 transform hover:scale-110"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(selectedBatch.id);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter batch name"
                      value={editForm.batch_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, batch_name: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Student Limit *
                    </label>
                    <input
                      type="number"
                      placeholder="Maximum students"
                      value={editForm.student_limit}
                      onChange={(e) =>
                        setEditForm({ ...editForm, student_limit: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      required
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, start_date: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={editForm.end_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, end_date: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={editForm.batch_start_time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, batch_start_time: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={editForm.batch_end_time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, batch_end_time: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Course Info Display */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <FaGraduationCap className="text-blue-500 text-xl" />
                    <div>
                      <p className="text-sm text-gray-600">Course (Cannot be changed)</p>
                      <p className="font-semibold text-gray-800">{editForm.course_name}</p>
                    </div>
                  </div>
                </div>

                {/* Hidden fields */}
                <input type="hidden" value={editForm.course_id} />
                <input type="hidden" value={editForm.branch_id} />

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
                  >
                    <FaEdit />
                    Update Batch
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default Allbatch;