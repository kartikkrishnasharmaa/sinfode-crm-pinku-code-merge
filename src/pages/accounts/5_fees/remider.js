import React, { useState, useEffect } from 'react';
import axios from "../../../api/axiosConfig";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Reminder = () => {
  const [activeTab, setActiveTab] = useState('overdue');
  const [overdueData, setOverdueData] = useState([]);
  const [todayData, setTodayData] = useState([]);
  const [upcomingData, setUpcomingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  // 🔍 Filter & Sort states
  const [filterConfig, setFilterConfig] = useState({
    searchText: "",
    status: "",
    sortField: "due_date",
    sortOrder: "asc",
  });

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  // ✅ Fetch Data by Active Tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/fee-reminders?type=${activeTab}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filteredData = (res.data.data || []).filter(
          (item) => item.fee_structure.student.branch_id === userBranchId
        );

        if (activeTab === "overdue") setOverdueData(filteredData);
        else if (activeTab === "today") setTodayData(filteredData);
        else setUpcomingData(filteredData);
      } catch (error) {
        console.error(`Error fetching ${activeTab} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, userBranchId]);

  // ✅ Formatters
  const formatDate = (dateString) => {
    const options = { day: "numeric", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);

  // ✅ Send Manual Reminder
  const sendReminder = async (installmentId) => {
    try {
      setSendingId(installmentId);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/send-manual-reminder",
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

  // ✅ Get Current Tab Data
  const getCurrentData = () => {
    let data =
      activeTab === "overdue"
        ? overdueData
        : activeTab === "today"
        ? todayData
        : upcomingData;

    // 🔍 Apply Filters
    if (filterConfig.searchText) {
      data = data.filter((item) => {
        const student = item.fee_structure.student;
        return (
          student.full_name
            .toLowerCase()
            .includes(filterConfig.searchText.toLowerCase()) ||
          student.admission_no
            ?.toString()
            .includes(filterConfig.searchText.trim())
        );
      });
    }

    if (filterConfig.status) {
      data = data.filter(
        (item) =>
          (filterConfig.status === "Paid" && item.pending_amount === 0) ||
          (filterConfig.status === "Pending" && item.pending_amount > 0) ||
          (filterConfig.status === "Advance" && item.pending_amount < 0)
      );
    }

    // 🔃 Apply Sorting
    data = [...data].sort((a, b) => {
      const field = filterConfig.sortField;
      let valA = a[field];
      let valB = b[field];

      // Handle amount sorting numerically
      if (field === "amount") {
        valA = Number(a.amount);
        valB = Number(b.amount);
      }

      if (field === "due_date") {
        valA = new Date(a.due_date);
        valB = new Date(b.due_date);
      }

      if (filterConfig.sortOrder === "asc") return valA > valB ? 1 : -1;
      else return valA < valB ? 1 : -1;
    });

    return data;
  };

  const filteredData = getCurrentData();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-blue-800">
        Fee Reminder
      </h2>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex gap-2 bg-gray-200 p-1 rounded-full">
          {["overdue", "today", "upcoming"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#3F8CFF] text-white"
                  : "bg-transparent text-gray-600 hover:bg-gray-300"
              }`}
            >
              {tab === "overdue"
                ? "Overdue"
                : tab === "today"
                ? "Today"
                : "Upcoming (7 Days)"}
            </button>
          ))}
        </div>
      </div>

      {/* Filters + Sorting */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-x-auto whitespace-nowrap mb-6">
        <input
          type="text"
          placeholder="Search by student name or admission no"
          value={filterConfig.searchText}
          onChange={(e) =>
            setFilterConfig((prev) => ({
              ...prev,
              searchText: e.target.value,
            }))
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
        />

        <select
          value={filterConfig.sortField}
          onChange={(e) =>
            setFilterConfig((prev) => ({ ...prev, sortField: e.target.value }))
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="due_date">Sort by Due Date</option>
          <option value="amount">Sort by Amount</option>
        </select>

        <select
          value={filterConfig.sortOrder}
          onChange={(e) =>
            setFilterConfig((prev) => ({ ...prev, sortOrder: e.target.value }))
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <button
          onClick={() =>
            setFilterConfig({
              searchText: "",
              status: "",
              sortField: "due_date",
              sortOrder: "asc",
            })
          }
          className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
        >
          Clear
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Student",
                    "Contact Number",
                    "Installment",
                    "Amount",
                    "Due Date",
                    "Status",
                    "Action",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.fee_structure.student.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.fee_structure.student.contact_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Installment #{item.installment_number}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(item.due_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          activeTab === "overdue"
                            ? "bg-red-100 text-red-800"
                            : activeTab === "today"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {activeTab === "overdue"
                          ? "Overdue"
                          : activeTab === "today"
                          ? "Due Today"
                          : "Upcoming"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => sendReminder(item.id)}
                        disabled={sendingId === item.id}
                        className={`px-3 py-1 rounded-md text-white text-sm font-medium ${
                          sendingId === item.id
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {sendingId === item.id
                          ? "Sending..."
                          : "Send Reminder"}
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
              No {activeTab} fees found for your branch.
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Reminder;
