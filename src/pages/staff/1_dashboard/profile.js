import SAAdminLayout from "../../../layouts/StaffLayout";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // 👈 for password toggle

  // Fetch branch info from API
  const fetchBranchData = async (user) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("⚠️ Token not found in localStorage");
        setError("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }
      let res;
      const headers = { Authorization: `Bearer ${token}` };

      if (user.role?.toLowerCase() === "staff") {
        console.log("🔹 Fetching branch...");
        res = await axios.get(`branches/${user.branch_id}`, { headers });
      } else {
        console.warn("⚠️ No matching API call condition found for this role.");
      }

      if (res?.data) {
        console.log("✅ Branch API Response:", res.data);
        const data = res.data.branch ? res.data.branch : res.data;
        setBranch(data);
      } else {
        console.warn("⚠️ No data received from API.");
      }
    } catch (error) {
      console.error("❌ Error fetching branch:", error);
      setError("Failed to load branch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Load user from localStorage and fetch data
  useEffect(() => {
    const userData = localStorage.getItem("user");
    console.log("🟢 LocalStorage user:", userData);

    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchBranchData(parsedUser);
    } else {
      console.warn("⚠️ No user data found in localStorage");
      setError("User not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <SAAdminLayout>
        <div className="py-6 px-4 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </SAAdminLayout>
    );
  }

  if (error) {
    return (
      <SAAdminLayout>
        <div className="py-6 px-4 min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-red-50 text-red-600 p-6 rounded-xl shadow-md">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      </SAAdminLayout>
    );
  }

  if (!user) {
    return (
      <SAAdminLayout>
        <div className="py-6 px-4 min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-700">No user data found.</p>
        </div>
      </SAAdminLayout>
    );
  }

  return (
    <SAAdminLayout>
      <div className="py-6 px-4 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account information</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <div className="flex flex-col md:flex-row items-center">
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                  <span className="text-3xl font-bold">{user.name?.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-blue-100 capitalize">{user.role}</p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Personal Information
                  </h3>

                  <InfoItem label="Full Name" value={user.name} color="blue" />
                  <InfoItem label="Email Address" value={user.email} color="green" />
                  <InfoItem label="Role" value={user.role} color="purple" />
                </div>

                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Account Information
                  </h3>

                  {/* 👇 Password with show/hide toggle */}
                  <div className="flex items-start">
                    <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg mr-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                      </svg>
                    </div>
                    <div className="w-full">
                      <p className="text-sm text-gray-500">Password</p>
                      <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                        <p className="font-medium">
                          {showPassword
                            ? user.plain_password || "Not Available"
                            : "•••••••••"}
                        </p>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <InfoItem label="Member Since" value={formatDate(user.created_at)} color="red" />
                  <InfoItem label="Last Updated" value={formatDate(user.updated_at)} color="indigo" />

                  <div className="flex items-start">
                    <div className="bg-gray-100 p-2 rounded-lg mr-3">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Status</p>
                      <div className="flex items-center">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                        <p className="font-medium text-green-600">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Branch Info */}
              {branch && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Branch Details</h3>
                  <p className="text-gray-600">
                    <strong>Name:</strong> {branch.branch_name || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    <strong>Location:</strong> {branch.state || "N/A"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SAAdminLayout>
  );
};

// ✅ Reusable info card item
const InfoItem = ({ label, value, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  return (
    <div className="flex items-start">
      <div className={`${colors[color]} p-2 rounded-lg mr-3`}>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
};

export default Profile;
