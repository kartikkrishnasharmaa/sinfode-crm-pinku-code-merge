import React, { useState, useEffect } from 'react';
import axios from "../../../api/axiosConfig";
import SAAdminLayout from "../../../layouts/Sinfodeadmin";

const BranchCommunication = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [communications, setCommunications] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newCommunication, setNewCommunication] = useState({
    branch_id: '',
    title: '',
    description: '',
    type: 'Internal',
    priority: 'Medium',
    amount: '',
    date: ''
  });

  // Fetch communications
  const fetchCommunications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found! Please login again.");
        setIsLoading(false);
        return;
      }

      const response = await axios.get("/communications/index", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCommunications(response.data.data);
      } 
    } catch (error) {
      console.error("Error fetching communications:", error);
      setError("Failed to load communications");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found! Please login again.");
        return;
      }

      const response = await axios.get("branches", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const branchData = response.data.map((branch) => ({
        id: branch.id,
        branch_name: branch.branch_name,
        branch_code: branch.branch_code || "BR-" + branch.id,
        city: branch.city,
        state: branch.state,
        contact: branch.contact_number,
        email: branch.email,
        status: branch.status,
        opening_date: branch.opening_date,
        pin_code: branch.pin_code || "",
        address: branch.address || "",
        branch_type: branch.branch_type || "Main",
      }));

      setBranches(branchData);
    } catch (error) {
      console.error("Error fetching branches:", error);
      setError("Failed to load branches");
    }
  };

  // Fetch single communication
  const fetchCommunication = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found! Please login again.");
        return;
      }

      const response = await axios.get(`/communications/show/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSelectedItem(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching communication:", error);
      setError("Failed to load communication details");
    }
  };

  // Create communication
  const createCommunication = async (communicationData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found! Please login again.");
        return false;
      }

      // Prepare data for API
      const apiData = {
        branch_id: communicationData.branch_id,
        title: communicationData.title,
        description: communicationData.description,
        type: communicationData.type,
        priority: communicationData.priority,
        amount: communicationData.amount || 0,
        date: communicationData.date || null
      };

      const response = await axios.post("/communications", apiData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Refresh communications list
        await fetchCommunications();
        return true;
      } 
    } catch (error) {
      console.error("Error creating communication:", error);
      setError("Failed to create communication");
      return false;
    }
  };

  // Update communication
  const updateCommunication = async (id, updateData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found! Please login again.");
        return false;
      }

      const response = await axios.put(`/communications/update/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Refresh communications list and selected item
        await fetchCommunications();
        if (selectedItem && selectedItem.id === id) {
          await fetchCommunication(id);
        }
        return true;
      } else {
        setError("Failed to update communication");
        return false;
      }
    } catch (error) {
      console.error("Error updating communication:", error);
      setError("Failed to update communication");
      return false;
    }
  };

  // Delete communication
  const deleteCommunication = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found! Please login again.");
        return false;
      }

      const response = await axios.delete(`/communications/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Refresh communications list
        await fetchCommunications();
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem(null);
        }
        return true;
      } else {
        setError("Failed to delete communication");
        return false;
      }
    } catch (error) {
      console.error("Error deleting communication:", error);
      setError("Failed to delete communication");
      return false;
    }
  };

  useEffect(() => {
    fetchCommunications();
    fetchBranches();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCommunication({
      ...newCommunication,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await createCommunication(newCommunication);

    if (success) {
      setShowCreateModal(false);
      setNewCommunication({
        branch_id: '',
        title: '',
        description: '',
        type: 'Internal',
        priority: 'Medium',
        amount: '',
        date: ''
      });
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    // Fetch full details if not already available
    if (!item.branch || !item.sender) {
      fetchCommunication(item.id);
    }
  };

  const filteredCommunications = communications.filter(item => {
    if (activeTab === 'all') return true;
    return item.type.toLowerCase() === activeTab.toLowerCase();
  });

  // Format data for display
  const formatDataForDisplay = (item) => {
    // Map API status to UI status
    const statusMap = {
      'paid': 'paid',
      'pending': 'pending',
      'overdue': 'overdue',
      'partial': 'partial'
    };

    // Map API priority to UI priority
    const priorityMap = {
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low'
    };

    return {
      id: item.id,
      type: item.type.toLowerCase(),
      title: item.title,
      description: item.description,
      branch: item.branch ? item.branch.branch_name : 'Unknown Branch',
      department: item.sender ? 'From: ' + item.sender.name : 'Unknown Sender',
      amount: item.amount ? `Rs.${parseFloat(item.amount).toLocaleString()}` : 'Rs.0',
      status: statusMap[item.status] || 'pending',
      priority: priorityMap[item.priority] || 'medium',
      author: item.sender ? item.sender.name : 'Unknown',
      timestamp: new Date(item.created_at).toLocaleDateString(),
      content: item.description,
      EventDate: item.date ? new Date(item.date).toLocaleDateString() : null
    };
  };

  // Type configurations for consistent styling
  const typeConfig = {
    internal: {
      color: 'blue',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      )
    },
    announcement: {
      color: 'purple',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    },
    event: {
      color: 'green',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
        </svg>
      )
    },
    meeting: {
      color: 'orange',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      )
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <SAAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Enhanced Header */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-xl">
          <div className="max-w-7xl mx-auto py-6 px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Branch Communication Hub</h1>
                  <p className="text-blue-100 mt-1">Manage all branch communications in one place</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Communication
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Enhanced Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
            <div className="p-8">
              <div className="flex flex-wrap gap-3 mb-2 bg-gradient-to-r from-gray-50 to-blue-50 p-2 rounded-2xl">
                {[
                  { key: 'all', label: 'All Communications', icon: '📨' },
                  { key: 'internal', label: 'Internal Messages', icon: '💬' },
                  { key: 'announcement', label: 'Announcements', icon: '📢' },
                  { key: 'event', label: 'Event Schedule', icon: '📅' },
                  { key: 'meeting', label: 'Meeting Notes', icon: '👥' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                      activeTab === tab.key 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Master-Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Enhanced Master List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Communications</h2>
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm px-4 py-2 rounded-full font-semibold shadow-lg">
                      {filteredCommunications.length} items
                    </span>
                  </div>
                </div>

                {/* Enhanced Master List Items */}
                <div className="overflow-y-auto max-h-[calc(100vh-300px)] p-4">
                  {filteredCommunications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gradient-to-br from-gray-100 to-blue-100 p-8 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No Communications Found</h3>
                      <p className="text-gray-600 mb-6">Create your first communication to get started.</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto transition-all duration-300 transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create First Communication
                      </button>
                    </div>
                  ) : (
                    filteredCommunications.map(item => {
                      const displayItem = formatDataForDisplay(item);
                      const type = displayItem.type;
                      const config = typeConfig[type] || typeConfig.internal;
                      
                      return (
                        <div
                          key={item.id}
                          className={`p-6 mb-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                            selectedItem?.id === item.id 
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg' 
                              : 'bg-white border border-gray-200 hover:shadow-xl'
                          }`}
                          onClick={() => handleSelectItem(item)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className={`p-2 rounded-xl bg-${config.color}-100 text-${config.color}-600`}>
                                  {config.icon}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 text-${config.color}-800 border border-${config.color}-200`}>
                                    {displayItem.type.charAt(0).toUpperCase() + displayItem.type.slice(1)}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    displayItem.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    displayItem.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                    'bg-green-100 text-green-800 border border-green-200'
                                  }`}>
                                    {displayItem.priority.charAt(0).toUpperCase() + displayItem.priority.slice(1)} Priority
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    displayItem.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    displayItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                    displayItem.status === 'overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    {displayItem.status.charAt(0).toUpperCase() + displayItem.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                              <h3 className="font-bold text-gray-900 text-lg mb-2">{displayItem.title}</h3>
                              <p className="text-gray-600 mb-4 line-clamp-2">{displayItem.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="font-medium">{displayItem.department}</span>
                                  <span>•</span>
                                  <span>{displayItem.branch}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600 text-lg">{displayItem.amount}</div>
                                  <div className="text-xs text-gray-500">
                                    {displayItem.timestamp} • By {displayItem.author}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Detail Panel */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-full overflow-hidden">
                {selectedItem ? (
                  <div className="p-8">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className={`p-4 rounded-2xl bg-gradient-to-r from-${typeConfig[selectedItem.type.toLowerCase()]?.color || 'blue'}-500 to-${typeConfig[selectedItem.type.toLowerCase()]?.color || 'blue'}-600 text-white shadow-lg`}>
                          {typeConfig[selectedItem.type.toLowerCase()]?.icon}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{selectedItem.title}</h2>
                          <p className="text-gray-600 flex items-center gap-2 mt-1">
                            <span className="font-semibold">{selectedItem.type}</span>
                            <span>•</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              selectedItem.priority === 'High' ? 'bg-red-100 text-red-800' :
                              selectedItem.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {selectedItem.priority} Priority
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => deleteCommunication(selectedItem.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-colors duration-300"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Communication Details
                        </h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Category:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${typeConfig[selectedItem.type.toLowerCase()]?.color || 'blue'}-100 text-${typeConfig[selectedItem.type.toLowerCase()]?.color || 'blue'}-800`}>
                              {selectedItem.type}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Priority:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              selectedItem.priority === 'High' ? 'bg-red-100 text-red-800' :
                              selectedItem.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {selectedItem.priority}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Created:</span>
                            <span className="text-sm font-medium text-gray-900">{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Branch:</span>
                            <span className="text-sm font-medium text-gray-900">{selectedItem.branch ? selectedItem.branch.branch_name : 'Unknown'}</span>
                          </div>
                          {selectedItem.date && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-600">Event Date:</span>
                              <span className="text-sm font-medium text-gray-900">{new Date(selectedItem.date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-2xl border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Author Information
                        </h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Author:</span>
                            <span className="text-sm font-medium text-gray-900">{selectedItem.sender ? selectedItem.sender.name : 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-medium text-gray-900">{selectedItem.sender ? selectedItem.sender.email : 'Unknown'}</span>
                          </div>
                          {selectedItem.amount && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-gray-600">Amount:</span>
                              <span className="text-lg font-bold text-green-600">Rs.{parseFloat(selectedItem.amount).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl border border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Communication Content
                      </h4>
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-gray-800 leading-relaxed">{selectedItem.description}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center h-full flex items-center justify-center">
                    <div>
                      <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Select a Communication</h3>
                      <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                        Choose an item from the list to view detailed information and communication content.
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 mx-auto transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Communication
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Create New Communication</h2>
                    <p className="text-blue-100 mt-2">Send a new message to your branches</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-white hover:text-blue-200 p-3 rounded-xl transition-colors duration-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Enhanced Communication Type Selection */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-6">Communication Type *</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { type: 'Internal', icon: '💬', color: 'blue' },
                        { type: 'Announcement', icon: '📢', color: 'purple' },
                        { type: 'Event', icon: '📅', color: 'green' },
                        { type: 'Meeting', icon: '👥', color: 'orange' }
                      ].map(({ type, icon, color }) => (
                        <label key={type} className="cursor-pointer">
                          <input
                            type="radio"
                            name="type"
                            value={type}
                            checked={newCommunication.type === type}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`border-3 rounded-2xl p-6 text-center transition-all duration-300 transform hover:scale-105 ${
                            newCommunication.type === type 
                              ? `border-${color}-500 bg-${color}-50 shadow-lg` 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                            <div className={`text-3xl mb-3 ${newCommunication.type === type ? `text-${color}-600` : 'text-gray-400'}`}>
                              {icon}
                            </div>
                            <p className={`font-semibold ${newCommunication.type === type ? `text-${color}-700` : 'text-gray-600'}`}>
                              {type}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Form Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Branch *</label>
                      <select
                        name="branch_id"
                        value={newCommunication.branch_id}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                        required
                      >
                        <option value="">Select Branch</option>
                        {branches.map(branch => (
                          <option key={branch.id} value={branch.id}>
                            {branch.branch_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Priority</label>
                      <select
                        name="priority"
                        value={newCommunication.priority}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {newCommunication.type === 'Event' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Event Date</label>
                        <input
                          type="date"
                          name="date"
                          value={newCommunication.date}
                          onChange={handleInputChange}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Amount (Optional)</label>
                      <input
                        type="number"
                        name="amount"
                        value={newCommunication.amount}
                        onChange={handleInputChange}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                        placeholder="Enter amount (optional)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={newCommunication.title}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                      placeholder="Enter communication title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Description *</label>
                    <textarea
                      rows="6"
                      name="description"
                      value={newCommunication.description}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 resize-none"
                      placeholder="Enter detailed description..."
                      required
                    ></textarea>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-gray-200 flex justify-end space-x-4 bg-gray-50 rounded-b-3xl">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-xl font-semibold transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Communication
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SAAdminLayout>
  );
};

export default BranchCommunication;