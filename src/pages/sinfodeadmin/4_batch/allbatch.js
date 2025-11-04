import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { FaEye, FaEdit, FaTrash, FaFilter, FaTimes, FaCalendar, FaUsers, FaClock, FaBuilding, FaGraduationCap } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
function Allbatch() {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);

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

  // Format time function
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    
    try {
      let timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0]);
        let minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
      }
      return timeString;
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeString;
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/batches/show", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const batchList = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];

      setBatches(batchList);
      setFilteredBatches(batchList);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/branches", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBranches(res.data.data || res.data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchBranches();
  }, []);

  // Filter batches by branch and search
  useEffect(() => {
    let filtered = batches;

    if (selectedBranch) {
      filtered = filtered.filter(
        (b) => String(b.branch_id) === String(selectedBranch)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.batch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.course?.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.branch?.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBatches(filtered);
  }, [selectedBranch, batches, searchTerm]);

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
    }
  };

  // Open edit modal with data
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
        batch_start_time: batchData.batch_start_time || "",
        batch_end_time: batchData.batch_end_time || "",
        course_id: batchData.course_id || "",
        branch_id: batchData.branch_id || "",
        course_name: batchData.course?.course_name || ""
      });
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error loading batch for edit:", error);
    }
  };

  // Submit edit form
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!editForm.batch_name || !editForm.start_date || 
          !editForm.end_date || !editForm.student_limit ||
          !editForm.batch_start_time || !editForm.batch_end_time) {
        toast.error("Please fill in all fields");
        return;
      }

      const token = localStorage.getItem("token");
      
      const updateData = {
        batch_name: editForm.batch_name,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        student_limit: parseInt(editForm.student_limit),
        batch_start_time: editForm.batch_start_time,
        batch_end_time: editForm.batch_end_time
      };
      
      await axios.put(`/batches/update/${selectedBatch.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("Batch updated successfully!");
      setIsEditModalOpen(false);
      fetchBatches();
    } catch (error) {
      console.error("Error updating batch:", error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || 'Update failed'}`);
      }
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (batch) => {
    setBatchToDelete(batch);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete batch
  const handleDeleteConfirm = async () => {
    if (!batchToDelete) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/batches/destroy/${batchToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("Batch deleted successfully!");
      setBatches(batches.filter((b) => b.id !== batchToDelete.id));
      setIsDeleteModalOpen(false);
      setBatchToDelete(null);
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast.error("Error deleting batch. Please try again.");
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedBranch("");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-3 font-nunito bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            All Batches
          </h1>
          <p className="text-gray-600 text-lg">Manage and view all training batches</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-800">{batches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl mr-4">
                <FaBuilding className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Branches</p>
                <p className="text-2xl font-bold text-gray-800">{branches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-xl mr-4">
                <FaFilter className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-gray-800">{filteredBatches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-xl mr-4">
                <FaGraduationCap className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-800">
                  {batches.filter(b => new Date(b.end_date) >= new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-slide-up">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center w-full lg:w-auto">
              <FaFilter className="text-blue-600 mr-3 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>

              {/* Reset Button */}
              <button
                onClick={handleResetFilters}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-400 transition-all duration-300 font-medium flex items-center justify-center"
              >
                <FaTimes className="mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64 animate-pulse">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading batches...</p>
            </div>
          </div>
        ) : filteredBatches.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center animate-fade-in">
            <div className="text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">No batches found</h3>
            <p className="text-gray-500 text-lg mb-6">
              {selectedBranch || searchTerm 
                ? "No batches match your current filters. Try adjusting your search criteria." 
                : "No batches available in the system."}
            </p>
            {(selectedBranch || searchTerm) && (
              <button
                onClick={handleResetFilters}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Batches Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-fade-in">
            {filteredBatches.map((batch, index) => (
              <div
                key={batch.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Batch Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold truncate pr-2">{batch.batch_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      new Date(batch.end_date) >= new Date() 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}>
                      {new Date(batch.end_date) >= new Date() ? 'Active' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">
                    {batch.course?.course_name || "No Course Assigned"}
                  </p>
                </div>

                {/* Batch Details */}
                <div className="p-6 space-y-4">
                  {/* Branch */}
                  <div className="flex items-center text-gray-700">
                    <div className="bg-blue-50 p-2 rounded-lg mr-3">
                      <FaBuilding className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Branch</p>
                      <p className="text-sm">{batch.branch?.branch_name || "N/A"}</p>
                    </div>
                  </div>

                  {/* Student Limit */}
                  <div className="flex items-center text-gray-700">
                    <div className="bg-green-50 p-2 rounded-lg mr-3">
                      <FaUsers className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Student Limit</p>
                      <p className="text-sm">{batch.student_limit} students</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-700">
                      <div className="bg-purple-50 p-2 rounded-lg mr-3">
                        <FaCalendar className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Start</p>
                        <p className="text-xs">{batch.start_date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <div className="bg-orange-50 p-2 rounded-lg mr-3">
                        <FaCalendar className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">End</p>
                        <p className="text-xs">{batch.end_date}</p>
                      </div>
                    </div>
                  </div>

                  {/* Times */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-700">
                      <div className="bg-indigo-50 p-2 rounded-lg mr-3">
                        <FaClock className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Start Time</p>
                        <p className="text-xs">{formatTime(batch.batch_start_time)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <div className="bg-pink-50 p-2 rounded-lg mr-3">
                        <FaClock className="text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">End Time</p>
                        <p className="text-xs">{formatTime(batch.batch_end_time)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
                  <button
                    className="text-blue-600 hover:text-blue-800 p-3 rounded-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-110"
                    onClick={() => handleView(batch.id)}
                    title="View batch details"
                  >
                    <FaEye size={18} />
                  </button>
                  <button
                    className="text-yellow-600 hover:text-yellow-800 p-3 rounded-xl hover:bg-yellow-50 transition-all duration-300 transform hover:scale-110"
                    onClick={() => handleEdit(batch.id)}
                    title="Edit batch"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 p-3 rounded-xl hover:bg-red-50 transition-all duration-300 transform hover:scale-110"
                    onClick={() => handleDeleteClick(batch)}
                    title="Delete batch"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md relative animate-scale-in">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
                <h2 className="text-2xl font-bold">
                  {selectedBatch.batch_name}
                </h2>
                <button
                  className="text-white hover:text-gray-200 p-2 rounded-xl hover:bg-white hover:bg-opacity-20 transition-all duration-300"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center p-3 bg-blue-50 rounded-xl">
                  <FaGraduationCap className="text-blue-600 mr-3" />
                  <div>
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium ml-2">{selectedBatch.course?.course_name || "N/A"}</span>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-green-50 rounded-xl">
                  <FaBuilding className="text-green-600 mr-3" />
                  <div>
                    <span className="text-gray-600">Branch:</span>
                    <span className="font-medium ml-2">{selectedBatch.branch?.branch_name || "N/A"}</span>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-purple-50 rounded-xl">
                  <FaUsers className="text-purple-600 mr-3" />
                  <div>
                    <span className="text-gray-600">Student Limit:</span>
                    <span className="font-medium ml-2">{selectedBatch.student_limit}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-orange-50 rounded-xl">
                    <FaCalendar className="text-orange-600 mr-3" />
                    <div>
                      <span className="text-gray-600">Start:</span>
                      <p className="font-medium text-sm">{selectedBatch.start_date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-red-50 rounded-xl">
                    <FaCalendar className="text-red-600 mr-3" />
                    <div>
                      <span className="text-gray-600">End:</span>
                      <p className="font-medium text-sm">{selectedBatch.end_date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-indigo-50 rounded-xl">
                    <FaClock className="text-indigo-600 mr-3" />
                    <div>
                      <span className="text-gray-600">Start Time:</span>
                      <p className="font-medium text-sm">{formatTime(selectedBatch.batch_start_time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-pink-50 rounded-xl">
                    <FaClock className="text-pink-600 mr-3" />
                    <div>
                      <span className="text-gray-600">End Time:</span>
                      <p className="font-medium text-sm">{formatTime(selectedBatch.batch_end_time)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end">
                <button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md relative animate-scale-in max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-t-2xl sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold">Edit Batch</h2>
                <button
                  className="text-white hover:text-gray-200 p-2 rounded-xl hover:bg-white hover:bg-opacity-20 transition-all duration-300"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              <form onSubmit={handleUpdate} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batch Name
                  </label>
                  <input
                    type="text"
                    value={editForm.batch_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, batch_name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student Limit
                  </label>
                  <input
                    type="number"
                    value={editForm.student_limit}
                    onChange={(e) =>
                      setEditForm({ ...editForm, student_limit: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
                    required
                    min="1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, start_date: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={editForm.end_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, end_date: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={editForm.batch_start_time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, batch_start_time: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editForm.batch_end_time}
                      onChange={(e) =>
                        setEditForm({ ...editForm, batch_end_time: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                  >
                    Update Batch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && batchToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md relative animate-scale-in">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-2xl">
                <h2 className="text-2xl font-bold">Confirm Delete</h2>
                <button
                  className="text-white hover:text-gray-200 p-2 rounded-xl hover:bg-white hover:bg-opacity-20 transition-all duration-300"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              <div className="p-6 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Delete {batchToDelete.batch_name}?
                </h3>
                <p className="text-gray-600 mb-6">
                  This action cannot be undone. All data associated with this batch will be permanently deleted.
                </p>
                
                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 font-medium"
                  >
                    Delete Batch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add custom animations to global CSS */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default Allbatch;