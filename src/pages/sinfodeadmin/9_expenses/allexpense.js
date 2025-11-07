import { useState, useEffect, useRef } from "react";
import axios from "../../../api/axiosConfig";

function AllExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ isOpen: false, expense: null });
  const [editForm, setEditForm] = useState({
    payment_to: "",
    amount: "",
    payment_mode: "",
    expense_date: "",
    description: ""
  });
  const [showDropdown, setShowDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const dropdownRefs = useRef({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      let shouldClose = true;
      
      // Check if click is inside any dropdown
      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(event.target)) {
          shouldClose = false;
        }
      });

      if (shouldClose) {
        setShowDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No token found! Please login again.");
          return;
        }

        const [expensesRes, branchesRes] = await Promise.all([
          axios.get("/expenses", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/branches", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (expensesRes.data.status) {
          setExpenses(expensesRes.data.data);
        } else {
          alert("Failed to fetch expenses");
        }

        setBranches(branchesRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Something went wrong while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique categories for filter
  const categories = [...new Set(expenses.map(exp => exp.category))];
  const paymentModes = [...new Set(expenses.map(exp => exp.payment_mode))];

  // Enhanced filtering
  const filteredExpenses = expenses.filter((exp) => {
    // Branch filter
    const branchMatch = selectedBranch === "all" || 
      (() => {
        const branch = branches.find(b => b.branch_name === exp.branch_name);
        return branch && branch.id.toString() === selectedBranch;
      })();
    
    // Category filter
    const categoryMatch = selectedCategory === "all" || exp.category === selectedCategory;
    
    // Payment mode filter
    const paymentModeMatch = selectedPaymentMode === "all" || exp.payment_mode === selectedPaymentMode;
    
    // Search filter
    const searchMatch = searchTerm === "" || 
      exp.payment_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date range filter
    let dateMatch = true;
    if (dateRange.start && dateRange.end) {
      const expenseDate = new Date(exp.expense_date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      dateMatch = expenseDate >= startDate && expenseDate <= endDate;
    }

    return branchMatch && categoryMatch && paymentModeMatch && searchMatch && dateMatch;
  });

  // Handle delete expense
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setExpenses(expenses.filter(exp => exp.id !== id));
      setShowDropdown(null);
      alert("Expense deleted successfully!");
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense");
    }
  };

  // Handle update expense
  const handleUpdate = (expense) => {
    setEditModal({ isOpen: true, expense });
    setEditForm({
      payment_to: expense.payment_to,
      amount: expense.amount,
      payment_mode: expense.payment_mode,
      expense_date: expense.expense_date,
      description: expense.description || ""
    });
    setShowDropdown(null);
  };

  // Handle save updated expense
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const { id } = editModal.expense;
      
      const res = await axios.put(`/expenses/${id}`, 
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setExpenses(expenses.map(exp => 
        exp.id === id ? { ...exp, ...editForm } : exp
      ));
      
      setEditModal({ isOpen: false, expense: null });
      alert("Expense updated successfully!");
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense");
    }
  };

  // Toggle dropdown menu with proper event handling
  const toggleDropdown = (id, e) => {
    if (e) {
      e.stopPropagation();
    }
    setShowDropdown(showDropdown === id ? null : id);
  };

  // Handle dropdown button click
  const handleDropdownClick = (id, e) => {
    e.stopPropagation();
    toggleDropdown(id, e);
  };

  // Handle edit button click
  const handleEditClick = (expense, e) => {
    e.stopPropagation();
    handleUpdate(expense);
  };

  // Handle delete button click
  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    handleDelete(id);
  };

  // Calculate total expenses for filtered results
  const totalExpenses = filteredExpenses.reduce((total, exp) => total + parseFloat(exp.amount), 0);

  // Clear all filters
  const clearFilters = () => {
    setSelectedBranch("all");
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedPaymentMode("all");
    setDateRange({ start: "", end: "" });
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Office Supplies': 'bg-blue-100 text-blue-800',
      'Utilities': 'bg-green-100 text-green-800',
      'Maintenance': 'bg-yellow-100 text-yellow-800',
      'Travel': 'bg-purple-100 text-purple-800',
      'Food': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Set dropdown ref for each expense
  const setDropdownRef = (id, el) => {
    dropdownRefs.current[id] = el;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 rounded-3xl text-white mb-8 shadow-2xl transform transition-all duration-300 hover:shadow-3xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                Expense Management
              </h2>
              <p className="text-purple-100 text-lg opacity-90">Track and manage all business expenses efficiently</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button 
                onClick={clearFilters}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 border border-white/30"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-4 mr-5 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{filteredExpenses.length} transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-4 mr-5 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Branches</p>
                <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                <p className="text-xs text-gray-400 mt-1">Active locations</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-100">
            <div className="flex items-center">
              <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 mr-5 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Filtered Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{filteredExpenses.length}</p>
                <p className="text-xs text-gray-400 mt-1">Matching your criteria</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                All Expenses <span className="text-purple-600">({filteredExpenses.length})</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">Manage and track your expenses efficiently</p>
            </div>

            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              {/* Search Input */}
              <div className="relative w-full lg:w-64">
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                />
                <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50 w-full lg:w-48"
              >
                <option value="all">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white"
              >
                <option value="all">All Payment Modes</option>
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Expenses Grid */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
                <p className="text-gray-500">Loading expenses...</p>
              </div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                <svg className="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">Try adjusting your filters or search terms to find what you're looking for.</p>
              <button 
                onClick={clearFilters}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredExpenses.map((exp, index) => (
                <div
                  key={exp.id}
                  className="bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl p-6 relative border border-gray-200 transform hover:-translate-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Actions Dropdown */}
                  <div 
                    className="absolute top-4 right-4"
                    ref={el => setDropdownRef(exp.id, el)}
                  >
                    <button 
                      onClick={(e) => handleDropdownClick(exp.id, e)}
                      className="inline-flex items-center p-2 border border-transparent rounded-2xl shadow-md text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-110"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>
                    
                    {showDropdown === exp.id && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-10 animate-dropdown">
                        <div className="py-2" role="menu" aria-orientation="vertical">
                          <button
                            onClick={(e) => handleEditClick(exp, e)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 transition-colors duration-200 rounded-t-2xl"
                            role="menuitem"
                          >
                            <svg className="h-4 w-4 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit Expense
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={(e) => handleDeleteClick(exp.id, e)}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 rounded-b-2xl"
                            role="menuitem"
                          >
                            <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete Expense
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Amount Highlight */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getCategoryColor(exp.category)}`}>
                        {exp.category}
                      </span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                          ₹{parseFloat(exp.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{exp.payment_mode}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div className="flex items-center bg-gray-50 rounded-2xl p-3">
                      <div className="rounded-xl bg-blue-100 p-2 mr-3">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-8 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Branch</span>
                        <p className="text-sm font-semibold text-gray-800">{exp.branch_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-gray-50 rounded-2xl p-3">
                      <div className="rounded-xl bg-green-100 p-2 mr-3">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Payment To</span>
                        <p className="text-sm font-semibold text-gray-800">{exp.payment_to}</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-gray-50 rounded-2xl p-3">
                      <div className="rounded-xl bg-purple-100 p-2 mr-3">
                        <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Date</span>
                        <p className="text-sm font-semibold text-gray-800">{new Date(exp.expense_date).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>

                    {exp.description && (
                      <div className="pt-3 border-t border-gray-200">
                        <span className="text-xs font-medium text-gray-500 block mb-2">Description</span>
                        <p className="text-sm text-gray-700 bg-blue-50 rounded-2xl p-3">{exp.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md transform animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Expense</h3>
                <button
                  onClick={() => setEditModal({ isOpen: false, expense: null })}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSaveUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="payment_to">
                      Payment To
                    </label>
                    <input
                      type="text"
                      id="payment_to"
                      value={editForm.payment_to}
                      onChange={(e) => setEditForm({...editForm, payment_to: e.target.value})}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="amount">
                      Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="payment_mode">
                      Payment Mode
                    </label>
                    <select
                      id="payment_mode"
                      value={editForm.payment_mode}
                      onChange={(e) => setEditForm({...editForm, payment_mode: e.target.value})}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                      required
                    >
                      <option value="">Select Payment Mode</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="expense_date">
                      Date
                    </label>
                    <input
                      type="date"
                      id="expense_date"
                      value={editForm.expense_date}
                      onChange={(e) => setEditForm({...editForm, expense_date: e.target.value})}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-gray-50"
                      rows="3"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => setEditModal({ isOpen: false, expense: null })}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-2xl focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-2xl focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllExpenses;