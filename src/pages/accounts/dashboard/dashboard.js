import { useEffect, useState } from "react";
import axios from "../../../api/axiosConfig";
import SAAdminLayout from "../../../layouts/AccountLayout";
import { FaArrowUp, FaFilter, FaRupeeSign, FaCalendarAlt } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [leadsData, setLeadsData] = useState({
    totalLeads: 0,
    convertedLeads: 0,
  });

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;
  const userBranchName = userData.branch_name || "Your Branch";

  // Fetch revenue data
  const fetchRevenueData = async () => {
    if (!userBranchId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/monthly-revenue", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          year: selectedYear,
          branch_id: userBranchId,
        },
      });

      const userBranchData = res.data.branches.find(
        (branch) => branch.branch_id === userBranchId
      );

      setRevenueData(userBranchData);

      const total =
        userBranchData?.monthly_revenue?.reduce((sum, month) => {
          return sum + parseFloat(month.student_fee || 0);
        }, 0) || 0;

      setTotalRevenue(total);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast.warning("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads data
  const fetchLeadsData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/leads/index", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          branch_id: userBranchId,
        },
      });

      const leads = response.data || [];
      const convertedLeads = leads.filter(
        (lead) => lead.lead_status === "Converted"
      ).length;

      setLeadsData({
        totalLeads: leads.length,
        convertedLeads,
      });
    } catch (error) {
      console.error("Error fetching leads data:", error);
    }
  };

  useEffect(() => {
    if (userBranchId) {
      fetchRevenueData();
      fetchLeadsData();
    }
  }, [userBranchId, selectedYear]);

  // Chart data
  const chartData = {
    labels:
      revenueData?.monthly_revenue?.map((item) => item.month.substring(0, 3)) ||
      [],
    datasets: [
      {
        label: "Monthly Revenue (₹)",
        data: revenueData?.monthly_revenue?.map((item) => item.student_fee) || [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
          "rgba(199, 199, 199, 0.8)",
          "rgba(83, 102, 255, 0.8)",
          "rgba(40, 159, 64, 0.8)",
          "rgba(210, 99, 132, 0.8)",
          "rgba(130, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
        ],
        borderColor: "rgba(255, 255, 255, 1)",
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: "rgba(54, 162, 235, 1)",
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#4B5563",
          font: {
            size: 12,
            family: "Nunito, sans-serif",
          },
        },
      },
      title: {
        display: true,
        text: `Monthly Revenue Analysis - ${selectedYear}`,
        color: "#374151",
        font: {
          size: 16,
          weight: "bold",
          family: "Nunito, sans-serif",
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1F2937",
        bodyColor: "#1F2937",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        padding: 10,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            return `Revenue: ₹${context.raw.toLocaleString("en-IN")}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "#4B5563",
          callback: function (value) {
            return "₹" + value.toLocaleString("en-IN");
          },
        },
        title: {
          display: true,
          text: "Revenue (₹)",
          color: "#4B5563",
          font: {
            family: "Nunito, sans-serif",
          },
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "#4B5563",
          font: {
            family: "Nunito, sans-serif",
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <SAAdminLayout>
      <div className="p-6 bg-[#F4F9FD] min-h-screen">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        {/* Header with Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <p className="text-gray-500">Welcome Back,</p>
            <h1 className="text-[30px] mb-2 font-nunito">Dashboard</h1>
          </div>

          {/* Modern Dynamic Year Input */}
          <div className="relative mt-4 md:mt-0 group">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-gray-200 shadow-md rounded-xl px-4 py-2 hover:shadow-lg transition-all duration-300 cursor-pointer">
              <FaFilter className="text-blue-500 text-lg" />
              <label htmlFor="yearInput" className="text-gray-700 font-medium text-sm">
                Enter Year
              </label>
              <div className="relative flex items-center">
                <FaCalendarAlt className="absolute left-2 text-gray-400" />
                <input
                  id="yearInput"
                  type="number"
                  className="pl-7 w-24 bg-transparent border-none text-gray-800 text-sm font-semibold outline-none focus:ring-0"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value) || "")}
                  placeholder="YYYY"
                />
              </div>
              <FaArrowUp className="text-gray-400 text-xs rotate-180 transition-transform duration-300 group-hover:rotate-0" />
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 -z-10 blur-xl opacity-40 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl"></div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold font-nunito">
                Revenue Summary
              </h2>
              <p className="text-sm opacity-90">
                Total revenue for {selectedYear}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold flex items-center justify-end">
                <FaRupeeSign className="mr-1" />{" "}
                {totalRevenue.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
                <h2 className="font-semibold text-xl font-nunito text-gray-800 mb-4 md:mb-0">
                  Revenue Analytics
                </h2>
              </div>

              <div className="mb-4 text-sm text-gray-600">
                Showing data for:{" "}
                <span className="font-semibold">{userBranchName}</span>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-80">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ) : revenueData ? (
                <div className="h-80">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="flex justify-center items-center h-80 text-gray-500">
                  <p>Loading revenue data for {userBranchName}...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SAAdminLayout>
  );
}
