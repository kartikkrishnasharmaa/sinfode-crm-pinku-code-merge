import React, { useState, useEffect } from 'react';
import axios from "../../../api/axiosConfig";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Reminder = () => {
  const [activeTab, setActiveTab] = useState('overdue');
  const [overdueData, setOverdueData] = useState([]);
  const [todayData, setTodayData] = useState([]);
  const [upcomingData, setUpcomingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    studentName: '',
    amountRange: '',
    dueDate: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: 'asc'
  });

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/fee-reminders?type=${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter by branch
        const filteredData = (res.data.data || []).filter(item => 
          item.fee_structure.student.branch_id === userBranchId
        );

        if (activeTab === 'overdue') setOverdueData(filteredData);
        else if (activeTab === 'today') setTodayData(filteredData);
        else setUpcomingData(filteredData);
        
        setFilteredData(filteredData);
      } catch (error) {
        console.error(`Error fetching ${activeTab} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, userBranchId]);

  // Apply filters and sorting whenever filters, sortConfig, or data changes
  useEffect(() => {
    let result = getCurrentData();

    // Apply student name filter
    if (filters.studentName) {
      result = result.filter(item =>
        item.fee_structure.student.full_name.toLowerCase().includes(filters.studentName.toLowerCase())
      );
    }

    // Apply amount range filter
    if (filters.amountRange) {
      const amount = parseFloat(filters.amountRange);
      result = result.filter(item => {
        const itemAmount = parseFloat(item.amount);
        switch (filters.amountRange) {
          case '0-1000':
            return itemAmount <= 1000;
          case '1000-5000':
            return itemAmount > 1000 && itemAmount <= 5000;
          case '5000+':
            return itemAmount > 5000;
          default:
            return true;
        }
      });
    }

    // Apply due date filter
    if (filters.dueDate) {
      const today = new Date();
      const filterDate = new Date(filters.dueDate);
      
      result = result.filter(item => {
        const dueDate = new Date(item.due_date);
        return dueDate.toDateString() === filterDate.toDateString();
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'student_name':
            aValue = a.fee_structure.student.full_name.toLowerCase();
            bValue = b.fee_structure.student.full_name.toLowerCase();
            break;
          case 'amount':
            aValue = parseFloat(a.amount);
            bValue = parseFloat(b.amount);
            break;
          case 'due_date':
            aValue = new Date(a.due_date);
            bValue = new Date(b.due_date);
            break;
          case 'installment_number':
            aValue = parseInt(a.installment_number);
            bValue = parseInt(b.installment_number);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredData(result);
  }, [filters, sortConfig, overdueData, todayData, upcomingData, activeTab]);

  const getCurrentData = () => {
    if (activeTab === 'overdue') return overdueData;
    if (activeTab === 'today') return todayData;
    return upcomingData;
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle sort requests
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      studentName: '',
      amountRange: '',
      dueDate: ''
    });
    setSortConfig({
      key: '',
      direction: 'asc'
    });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Send manual reminder API
  const sendReminder = async (installmentId) => {
    try {
      setSendingId(installmentId);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        '/send-manual-reminder',
        { installment_id: installmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Reminder sent successfully!");
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error(error.response?.data?.message || "Failed to send reminder");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-800">Fee Reminder</h2>
      
      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-2 bg-gray-200 p-1 rounded-full">
          {['overdue', 'today', 'upcoming'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab ? "bg-[#3F8CFF] text-white" : "bg-transparent text-gray-600 hover:bg-gray-300"
              }`}
            >
              {tab === 'overdue' ? 'Overdue' : tab === 'today' ? 'Today' : 'Upcoming (7 Days)'}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filters & Sorting</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Student Name</label>
            <input
              type="text"
              placeholder="Search student..."
              value={filters.studentName}
              onChange={(e) => handleFilterChange('studentName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Amount Range</label>
            <select
              value={filters.amountRange}
              onChange={(e) => handleFilterChange('amountRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Amounts</option>
              <option value="0-1000">₹0 - ₹1,000</option>
              <option value="1000-5000">₹1,000 - ₹5,000</option>
              <option value="5000+">₹5,000+</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
            <input
              type="date"
              value={filters.dueDate}
              onChange={(e) => handleFilterChange('dueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 bg-gray-50 border-b">
              <p className="text-sm text-gray-600">
                Showing {filteredData.length} of {getCurrentData().length} records
                {filters.studentName || filters.amountRange || filters.dueDate ? ' (filtered)' : ''}
              </p>
            </div>
            
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Student
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Number
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Installment
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Amount
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Due Date
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.fee_structure.student.full_name}
                              </div>
                          
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.fee_structure.student.contact_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Installment #{item.installment_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${activeTab === 'overdue' ? 'bg-red-100 text-red-800' : 
                              activeTab === 'today' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'}`}>
                            {activeTab === 'overdue' ? 'Overdue' : activeTab === 'today' ? 'Due Today' : 'Upcoming'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => sendReminder(item.id)}
                            disabled={sendingId === item.id}
                            className={`px-3 py-1 rounded-md text-white text-sm font-medium ${
                              sendingId === item.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                          >
                            {sendingId === item.id ? 'Sending...' : 'Send Reminder'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  {getCurrentData().length === 0 
                    ? `No ${activeTab} fees found for your branch.`
                    : 'No records match your current filters.'
                  }
                </p>
                {(filters.studentName || filters.amountRange || filters.dueDate) && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Reminder;
