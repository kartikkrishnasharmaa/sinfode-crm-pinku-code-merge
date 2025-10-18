import SAAdminLayout from "../../../layouts/Sinfodemanager";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig"; // adjust path if needed
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchBranchData(parsedUser);
    }
  }, []);

  // Fetch branch info from API
  const fetchBranchData = async (user) => {
    try {
      const token = localStorage.getItem("token");
      let res;

      if (user.role === "admin") {
        res = await axios.get("branches", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (user.role === "branch_manager" && user.branch_id) {
        res = await axios.get(`branches/${user.branch_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (res?.data) {
        const data = res.data.branch ? res.data.branch : res.data;
        setBranch(data);
      }
    } catch (error) {
      console.error("Error fetching branch:", error);
    } finally {
      setLoading(false);
    }
  };

  // Date formatter
  const formatDate = (dateString) => {
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

  if (!user) {
    return (
      <SAAdminLayout>
        <div className="py-6 px-4 text-center text-gray-600">
          No user data found.
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
                  <span className="text-3xl font-bold">{user.name.charAt(0)}</span>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-blue-100 capitalize">{user.role}</p>
                  {branch && (
                    <p className="text-blue-200 text-sm mt-1">
                      {branch.branch_name} — {branch.city}
                    </p>
                  )}
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

                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium">{user.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                </div>

                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Account Information
                  </h3>

                  {/* Password Field with Eye Toggle */}
                  <div>
                    <p className="text-sm text-gray-500">Password</p>
                    <div className="relative w-fit">
                      <input
                        type={showPassword ? "text" : "password"}
                        readOnly
                        value={user.plain_password}
                        className="font-mono bg-gray-100 px-2 py-1 rounded border border-gray-300 pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">{formatDate(user.created_at)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(user.updated_at)}</p>
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

              {/* Branch Information Section */}
              {branch && (
                <div className="mt-10 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Branch Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Branch Name</p>
                      <p className="font-medium">{branch.branch_name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Branch Code</p>
                      <p className="font-medium">{branch.branch_code}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-medium capitalize">{branch.city}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{branch.address}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Pin Code</p>
                      <p className="font-medium">{branch.pin_code}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Branch Type</p>
                      <p className="font-medium">{branch.branch_type}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SAAdminLayout>
  );
};

export default Profile;
