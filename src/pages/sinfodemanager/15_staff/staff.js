// import SAManagerLayout from "../../../layouts/Sinfodemanager"; // Assuming you have a layout component for the admin dashboard

import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import {
  FaEdit,
  FaEye,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaTimes,
  FaFileExcel,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarAlt,
  FaSearch
} from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // for navigation
import * as XLSX from "xlsx";

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  // Filter and Sort states
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
    designation: "all",
    dateRange: {
      start: "",
      end: ""
    }
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending"
  });

  // Form data
  const [formData, setFormData] = useState({
    employee_name: "",
    designation: "",
    joining_date: "",
    contact_number: "",
    email: "",
    department: "",
    status: "Active", // Changed to match likely backend expectations
    branch_id: userBranchId || "", // Set default to user's branch
    staffcreate_name: "",
    staffcreate_email: "",
    staffcreate_password: "",
    monthly_salary: ""
  });

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found! Please login again.");
        return;
      }
      const res = await axios.get("/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStaffList(res.data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      alert("Failed to load staff list");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Toggle status (Active/Inactive)
  const toggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      // Normalize status values to match backend expectations
      const normalizedStatus = currentStatus.toLowerCase() === "active" ? "Active" : "Inactive";
      const newStatus = normalizedStatus === "Active" ? "Inactive" : "Active";

      await axios.put(
        `/staff/update/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStaffList(
        staffList.map((staff) =>
          staff.id === id ? { ...staff, status: newStatus } : staff
        )
      );
      alert(`Status changed to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  // Delete staff
  const deleteStaff = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/staff/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Staff deleted successfully!");
        fetchStaff();
      } catch (error) {
        console.error("Error deleting staff:", error);
        alert("Failed to delete staff");
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle date range changes
  const handleDateRangeChange = (rangeType, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [rangeType]: value
      }
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: "all",
      department: "all",
      designation: "all",
      dateRange: {
        start: "",
        end: ""
      }
    });
    setSearch("");
  };

  // Get unique values for filter dropdowns
  const uniqueDepartments = [...new Set(staffList.map(staff => staff.department).filter(Boolean))];
  const uniqueDesignations = [...new Set(staffList.map(staff => staff.designation).filter(Boolean))];

  // Handle sorting
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting and filtering
  const processedStaff = staffList
    .filter((staff) => {
      // Search filter
      const matchesSearch = 
        (staff.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (staff.designation || "").toLowerCase().includes(search.toLowerCase()) ||
        (staff.employee_code || "").toLowerCase().includes(search.toLowerCase()) ||
        (staff.email || "").toLowerCase().includes(search.toLowerCase());

      // Status filter
      const matchesStatus = filters.status === "all" || staff.status === filters.status;
      
      // Department filter
      const matchesDepartment = filters.department === "all" || staff.department === filters.department;
      
      // Designation filter
      const matchesDesignation = filters.designation === "all" || staff.designation === filters.designation;
      
      // Date range filter
      const joiningDate = new Date(staff.joining_date);
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
      
      const matchesDateRange = 
        (!startDate || joiningDate >= startDate) && 
        (!endDate || joiningDate <= endDate);

      return matchesSearch && matchesStatus && matchesDepartment && matchesDesignation && matchesDateRange;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key === 'joining_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === "ascending" ? 
      <FaSortUp className="text-blue-600" /> : 
      <FaSortDown className="text-blue-600" />;
  };

  // Handle form input
  const handleChange = (e) => {
    // For contact number, limit to 10 digits
    if (e.target.name === "contact_number") {
      const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
      if (value.length <= 10) {
        setFormData({ ...formData, [e.target.name]: value });
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Edit click
  const handleEditClick = (staff) => {
    setEditingStaffId(staff.id);
    setFormData({
      employee_name: staff.employee_name,
      designation: staff.designation,
      joining_date: staff.joining_date,
      contact_number: staff.contact_number,
      email: staff.email,
      department: staff.department,
      status: staff.status, // Use the exact value from the backend
      branch_id: staff.branch_id,
      staffcreate_name: staff.staffcreate_name,
      staffcreate_email: staff.staffcreate_email,
      staffcreate_password: "", // Don't prefill password for security
      monthly_salary: staff.monthly_salary
    });
    setIsModalOpen(true);
  };

  // Create click
  const handleCreateClick = () => {
    setEditingStaffId(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Create/Update submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Prepare data with user's branch_id and properly formatted status
      const submitData = {
        ...formData,
        branch_id: userBranchId, // Always use the logged-in user's branch
        status: formData.status // Use the exact value from the form
      };

      if (editingStaffId) {
        // Update
        await axios.put(`/staff/update/${editingStaffId}`, submitData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Staff updated successfully!");
      } else {
        // Create
        await axios.post("/staff/create", submitData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Staff created successfully!");
      }

      fetchStaff();
      setIsModalOpen(false);
      setEditingStaffId(null);
      resetForm();
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.errors) {
        // Display validation errors from backend
        const errors = error.response.data.errors;
        let errorMessage = "Please fix the following errors:\n";
        for (const field in errors) {
          errorMessage += `${field}: ${errors[field].join(", ")}\n`;
        }
        alert(errorMessage);
      } else {
        alert(editingStaffId ? "Error updating staff" : "Error creating staff");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      employee_name: "",
      employee_code: "",
      designation: "",
      joining_date: "",
      contact_number: "",
      email: "",
      department: "",
      status: "Active", // Reset to default value
      branch_id: userBranchId || "",
      staffcreate_name: "",
      staffcreate_email: "",
      staffcreate_password: "",
      monthly_salary: ""
    });
  };

  // Export to Excel function
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(processedStaff);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Data");
    XLSX.writeFile(workbook, "staff_data.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-600">Manage your staff members efficiently</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaFileExcel /> Export to Excel
            </button>
            <button
              onClick={handleCreateClick}
              className="bg-[#3F8CFF] hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> Create Staff
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, designation, email, or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 p-2 pl-10 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaFilter /> Filters
              {Object.values(filters).some(filter => 
                typeof filter === 'string' ? filter !== 'all' : 
                Object.values(filter).some(Boolean)
              ) && (
                <span className="bg-red-500 text-white rounded-full w-2 h-2"></span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Designation Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <select
                    value={filters.designation}
                    onChange={(e) => handleFilterChange('designation', e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Designations</option>
                    {uniqueDesignations.map(designation => (
                      <option key={designation} value={designation}>{designation}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date Range</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      className="border border-gray-300 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      className="border border-gray-300 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End Date"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-800">{staffList.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaPlus className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-green-600">
                  {staffList.filter(staff => staff.status === 'Active').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaToggleOn className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Inactive Staff</p>
                <p className="text-2xl font-bold text-red-600">
                  {staffList.filter(staff => staff.status === 'Inactive').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FaToggleOff className="text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-purple-600">{processedStaff.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FaFilter className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th 
                    className="p-3 text-sm font-semibold tracking-wide text-left cursor-pointer hover:bg-gray-100 transition-colors"
                  
                  >
                    <div className="flex items-center gap-1">
                      Name 
                    </div>
                  </th>
                  <th 
                    className="p-3 text-sm font-semibold tracking-wide text-left cursor-pointer hover:bg-gray-100 transition-colors"
                 
                  >
                    <div className="flex items-center gap-1">
                      Designation
                    </div>
                  </th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-left">Contact</th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-left">Email</th>
                  {/* <th 
                    className="p-3 text-sm font-semibold tracking-wide text-left cursor-pointer hover:bg-gray-100 transition-colors"
                   
                  >
                    <div className="flex items-center gap-1">
                      Department
                    </div>
                  </th> */}
                  <th 
                    className="p-3 text-sm font-semibold tracking-wide text-left cursor-pointer hover:bg-gray-100 transition-colors"
                 
                  >
                    <div className="flex items-center gap-1">
                      {/* <FaCalendarAlt className="text-gray-400" /> */}
                      Joining Date 
                    </div>
                  </th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-left">Status</th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processedStaff.length > 0 ? (
                  processedStaff.map((staff, index) => (
                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-700">
                        <div>
                          <p className="font-medium text-gray-900">{staff.employee_name}</p>
                        
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-700">{staff.designation}</td>
                      <td className="p-3 text-sm text-gray-700">{staff.contact_number}</td>
                      <td className="p-3 text-sm text-gray-700">{staff.email}</td>
                      {/* <td className="p-3 text-sm text-gray-700">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {staff.department}
                        </span>
                      </td> */}
                      <td className="p-3 text-sm text-gray-700">
                        {new Date(staff.joining_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            staff.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {staff.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => toggleStatus(staff.id, staff.status)}
                            className={`p-2 rounded-lg transition-colors ${
                              staff.status === "Active"
                                ? "text-green-600 hover:bg-green-100"
                                : "text-red-600 hover:bg-red-100"
                            }`}
                            title="Toggle Status"
                          >
                            {staff.status === "Active" ? (
                              <FaToggleOn size={18} />
                            ) : (
                              <FaToggleOff size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => navigate(`/sinfodemanager/staff/${staff.id}`)}
                            className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                            title="View Staff"
                          >
                            <FaEye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditClick(staff)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Staff"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => deleteStaff(staff.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Staff"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center p-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FaSearch className="text-4xl text-gray-300 mb-2" />
                        <p className="text-lg">No staff members found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Info */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing <span className="font-medium">{processedStaff.length}</span> of{" "}
            <span className="font-medium">{staffList.length}</span> staff members
          </div>
          <div className="text-xs text-gray-500">
            Sorted by: {sortConfig.key ? `${sortConfig.key} (${sortConfig.direction})` : 'None'}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingStaffId(null);
                  resetForm();
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <FaTimes size={20} />
              </button>

              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {editingStaffId ? "Update Staff" : "Create Staff"}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Name *
                  </label>
                  <input
                    name="employee_name"
                    value={formData.employee_name}
                    onChange={handleChange}
                    placeholder="Enter employee name"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation *
                  </label>
                  <input
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Enter designation"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date *
                  </label>
                  <input
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    type="date"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Monthly Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Salary *
                  </label>
                  <input
                    name="monthly_salary"
                    value={formData.monthly_salary}
                    onChange={handleChange}
                    placeholder="Enter monthly salary"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    type="number"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="Enter 10-digit contact number"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="tel"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    type="email"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Enter department"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Staff Create Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Create Name *
                  </label>
                  <input
                    name="staffcreate_name"
                    value={formData.staffcreate_name}
                    onChange={handleChange}
                    placeholder="Enter staff create name"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Staff Create Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Create Email *
                  </label>
                  <input
                    name="staffcreate_email"
                    value={formData.staffcreate_email}
                    onChange={handleChange}
                    placeholder="Enter staff create email"
                    type="email"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Staff Create Password */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Create Password {!editingStaffId && "*"}
                  </label>
                  <input
                    name="staffcreate_password"
                    value={formData.staffcreate_password}
                    onChange={handleChange}
                    placeholder="Enter staff create password"
                    type="password"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!editingStaffId}
                  />
                  {editingStaffId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to keep current password
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingStaffId(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : editingStaffId ? "Update Staff" : "Create Staff"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
