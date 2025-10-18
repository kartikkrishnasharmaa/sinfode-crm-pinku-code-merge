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
  FaSearch,
  FaRupeeSign
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

export default function Accountant() {
  const [accountantList, setAccountantList] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingAccountantId, setEditingAccountantId] = useState(null);
  const [currentAccountant, setCurrentAccountant] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Filter and Sort states
  const [filters, setFilters] = useState({
    status: "all",
    department: "all",
    attendance_status: "all",
    salaryRange: {
      min: "",
      max: ""
    },
    dateRange: {
      start: "",
      end: ""
    }
  });

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending"
  });

  // Form data for accountant
  const [formData, setFormData] = useState({
    accountant_name: "",
    accountant_code: "",
    joining_date: "",
    contact_number: "",
    email: "",
    department: "",
    attendance_status: "Present",
    branch_id: "",
    monthly_salary: "",
    acccreate_name: "",
    acccreate_email: "",
    acccreate_password: "",
    status: "Active"
  });

  // Fetch accountants list
  const fetchAccountants = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found! Please login again.");
        return;
      }
      const res = await axios.get("/accountants", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle both array and object response formats
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      }
      
      setAccountantList(data);
    } catch (error) {
      console.error("Error fetching accountants:", error);
      alert("Failed to load accountants list");
    }
  };

  useEffect(() => {
    fetchAccountants();
  }, []);

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

  // Handle salary range changes
  const handleSalaryRangeChange = (rangeType, value) => {
    setFilters(prev => ({
      ...prev,
      salaryRange: {
        ...prev.salaryRange,
        [rangeType]: value
      }
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: "all",
      department: "all",
      attendance_status: "all",
      salaryRange: {
        min: "",
        max: ""
      },
      dateRange: {
        start: "",
        end: ""
      }
    });
    setSearch("");
  };

  // Get unique values for filter dropdowns
  const uniqueDepartments = [...new Set(accountantList.map(acc => acc.department).filter(Boolean))];
  const uniqueStatuses = [...new Set(accountantList.map(acc => acc.status).filter(Boolean))];
  const uniqueAttendanceStatuses = [...new Set(accountantList.map(acc => acc.attendance_status).filter(Boolean))];

  // Handle sorting
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === "ascending" ? 
      <FaSortUp className="text-blue-600" /> : 
      <FaSortDown className="text-blue-600" />;
  };

  // Apply sorting and filtering
  const processedAccountants = accountantList
    .filter((accountant) => {
      // Search filter
      const matchesSearch = 
        (accountant.accountant_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (accountant.department || "").toLowerCase().includes(search.toLowerCase()) ||
        (accountant.accountant_code || "").toLowerCase().includes(search.toLowerCase()) ||
        (accountant.email || "").toLowerCase().includes(search.toLowerCase());

      // Status filter
      const matchesStatus = filters.status === "all" || accountant.status === filters.status;
      
      // Department filter
      const matchesDepartment = filters.department === "all" || accountant.department === filters.department;
      
      // Attendance status filter
      const matchesAttendance = filters.attendance_status === "all" || accountant.attendance_status === filters.attendance_status;
      
      // Salary range filter
      const salary = parseFloat(accountant.monthly_salary) || 0;
      const minSalary = filters.salaryRange.min ? parseFloat(filters.salaryRange.min) : 0;
      const maxSalary = filters.salaryRange.max ? parseFloat(filters.salaryRange.max) : Infinity;
      const matchesSalary = salary >= minSalary && salary <= maxSalary;
      
      // Date range filter
      const joiningDate = new Date(accountant.joining_date);
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
      
      const matchesDateRange = 
        (!startDate || joiningDate >= startDate) && 
        (!endDate || joiningDate <= endDate);

      return matchesSearch && matchesStatus && matchesDepartment && matchesAttendance && matchesSalary && matchesDateRange;
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

      // Handle numeric sorting (salary)
      if (sortConfig.key === 'monthly_salary') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
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

  // Handle form input with contact number validation
  const handleChange = (e) => {
    if (e.target.name === "contact_number") {
      const value = e.target.value.replace(/\D/g, '');
      if (value.length <= 10) {
        setFormData({ ...formData, [e.target.name]: value });
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Toggle attendance status
  const toggleAttendance = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = currentStatus === "Present" ? "Absent" : "Present";

      await axios.put(
        `/accountants/${id}`,
        { attendance_status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAccountantList(
        accountantList.map((accountant) =>
          accountant.id === id ? { ...accountant, attendance_status: newStatus } : accountant
        )
      );
      alert(`Attendance status changed to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update attendance");
    }
  };

  // Delete accountant
  const deleteAccountant = async (id) => {
    if (window.confirm("Are you sure you want to delete this accountant?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/accountants/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Accountant deleted successfully!");
        fetchAccountants();
      } catch (error) {
        console.error("Error deleting accountant:", error);
        alert("Failed to delete accountant");
      }
    }
  };

  // Edit click
  const handleEditClick = (accountant) => {
    setEditingAccountantId(accountant.id);
    setFormData({
      accountant_name: accountant.accountant_name,
      accountant_code: accountant.accountant_code,
      joining_date: accountant.joining_date,
      contact_number: accountant.contact_number,
      email: accountant.email,
      department: accountant.department,
      attendance_status: accountant.attendance_status,
      branch_id: accountant.branch_id,
      monthly_salary: accountant.monthly_salary,
      acccreate_name: accountant.user?.email || "",
      acccreate_email: accountant.user?.email || "",
      acccreate_password: "",
      status: accountant.status || "Active"
    });
    setIsModalOpen(true);
  };

  // Create click
  const handleCreateClick = () => {
    setEditingAccountantId(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Create/Update submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (editingAccountantId) {
        const { acccreate_name, acccreate_email, acccreate_password, ...updateData } = formData;
        await axios.put(`/accountants/${editingAccountantId}`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Accountant updated successfully!");
      } else {
        await axios.post("/accountants", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Accountant created successfully!");
      }

      fetchAccountants();
      setIsModalOpen(false);
      setEditingAccountantId(null);
      resetForm();
    } catch (error) {
      console.error(error);
      alert(editingAccountantId ? "Error updating accountant" : "Error creating accountant");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      accountant_name: "",
      accountant_code: "",
      joining_date: "",
      contact_number: "",
      email: "",
      department: "",
      attendance_status: "Present",
      branch_id: "",
      monthly_salary: "",
      acccreate_name: "",
      acccreate_email: "",
      acccreate_password: "",
      status: "Active"
    });
  };

  // Export to Excel function
  const exportToExcel = () => {
    const dataToExport = processedAccountants.map(accountant => ({
      "Accountant Name": accountant.accountant_name,
      "Accountant Code": accountant.accountant_code,
      "Department": accountant.department,
      "Joining Date": accountant.joining_date,
      "Contact Number": accountant.contact_number,
      "Email": accountant.email,
      "Monthly Salary": accountant.monthly_salary,
      "Branch ID": accountant.branch_id,
      "Attendance Status": accountant.attendance_status,
      "Status": accountant.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accountants Data");
    XLSX.writeFile(workbook, "accountants_data.xlsx");
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "0.00";
    return parseFloat(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Accountants Management</h1>
            <p className="text-gray-600">Manage your accountants efficiently</p>
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
              <FaPlus /> Create Accountant
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
                placeholder="Search by name, department, code, or email..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
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


                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date Range</label>
                  <div className="flex gap-2">
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
                <p className="text-sm text-gray-600">Total Accountants</p>
                <p className="text-2xl font-bold text-gray-800">{accountantList.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaPlus className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Active Accountants</p>
                <p className="text-2xl font-bold text-green-600">
                  {accountantList.filter(acc => acc.status === 'Active').length}
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
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-purple-600">{processedAccountants.length}</p>
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
                  <th className="p-3 text-sm font-semibold tracking-wide text-left">Sr. No.</th>
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
                      Department
                    </div>
                  </th>
                  <th 
                    className="p-3 text-sm font-semibold tracking-wide text-left cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt className="text-gray-400" />
                      Joining Date
                    </div>
                  </th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-left">Contact</th>
                  <th 
                    className="p-3 text-sm font-semibold tracking-wide text-left cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <FaRupeeSign className="text-gray-400" />
                      Salary
                    </div>
                  </th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-left">Status</th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processedAccountants.length > 0 ? (
                  processedAccountants.map((accountant, index) => (
                    <tr key={accountant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-700">{index + 1}</td>
                      <td className="p-3 text-sm text-gray-700">
                        <div>
                          <p className="font-medium text-gray-900">{accountant.accountant_name}</p>
                      
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {accountant.department}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {new Date(accountant.joining_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm text-gray-700">{accountant.contact_number}</td>
                      <td className="p-3 text-sm text-gray-700 font-medium">
                        <div className="flex items-center gap-1">
                          <FaRupeeSign className="text-gray-400 text-xs" />
                          {formatCurrency(accountant.monthly_salary)}
                        </div>
                      </td>
                 
                      <td className="p-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          accountant.status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {accountant.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(accountant)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Accountant"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => deleteAccountant(accountant.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Accountant"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center p-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FaSearch className="text-4xl text-gray-300 mb-2" />
                        <p className="text-lg">No accountants found</p>
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
            Showing <span className="font-medium">{processedAccountants.length}</span> of{" "}
            <span className="font-medium">{accountantList.length}</span> accountants
          </div>
          <div className="text-xs text-gray-500">
            Sorted by: {sortConfig.key ? `${sortConfig.key} (${sortConfig.direction})` : 'None'}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAccountantId(null);
                  resetForm();
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <FaTimes size={20} />
              </button>

              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {editingAccountantId ? "Update Accountant" : "Create Accountant"}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accountant Name *</label>
                  <input
                    name="accountant_name"
                    value={formData.accountant_name}
                    onChange={handleChange}
                    placeholder="Accountant Name"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accountant Code</label>
                  <input
                    name="accountant_code"
                    value={formData.accountant_code}
                    onChange={handleChange}
                    placeholder="Accountant Code"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                  <input
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    type="date"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="Contact Number"
                    type="tel"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    type="email"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Department"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary *</label>
                  <input
                    name="monthly_salary"
                    value={formData.monthly_salary}
                    onChange={handleChange}
                    placeholder="Monthly Salary"
                    type="number"
                    className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                {/* Status Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
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
                
                {/* User creation fields - only show when creating new accountant */}
                {!editingAccountantId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Login Username *</label>
                      <input
                        name="acccreate_name"
                        value={formData.acccreate_name}
                        onChange={handleChange}
                        placeholder="Login Username"
                        className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Login Email *</label>
                      <input
                        name="acccreate_email"
                        value={formData.acccreate_email}
                        onChange={handleChange}
                        placeholder="Login Email"
                        type="email"
                        className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Login Password *</label>
                      <input
                        name="acccreate_password"
                        value={formData.acccreate_password}
                        onChange={handleChange}
                        placeholder="Login Password"
                        type="password"
                        className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingAccountantId(null);
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
                    {loading ? "Saving..." : editingAccountantId ? "Update Accountant" : "Create Accountant"}
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
