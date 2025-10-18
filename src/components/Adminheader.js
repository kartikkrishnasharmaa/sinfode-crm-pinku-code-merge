import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { HiMenu, HiX, HiBell, HiChevronDown } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";

const Adminheader = ({ toggleSidebar, isSidebarOpen, isMobile }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const selectedBranch = useSelector((state) => state.branch.selectedBranch);

  const LAST_SEEN_COUNT_KEY = "admin_lastSeenDiscountRequestCount";

  // ✅ Fetch only latest pending discount requests
  const fetchDiscountRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/discount-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && Array.isArray(response.data)) {
        // ✅ Keep only pending requests (exclude approved/rejected)
        const pendingRequests = response.data
          .filter((req) => req.status?.toLowerCase() === "pending")
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // latest first

        // Update notification list
        setNotifications(pendingRequests);

        // Handle unseen count
        const storedLastSeenRaw = localStorage.getItem(LAST_SEEN_COUNT_KEY);
        const storedLastSeenCount = storedLastSeenRaw
          ? Number(storedLastSeenRaw)
          : 0;

        const newCount =
          pendingRequests.length > storedLastSeenCount
            ? pendingRequests.length - storedLastSeenCount
            : 0;

        setNotificationCount(newCount);
      }
    } catch (err) {
      console.error("Error fetching discount requests:", err);
    }
  };

  // Fetch periodically every 30s
  useEffect(() => {
    fetchDiscountRequests();
    const interval = setInterval(fetchDiscountRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Handle click outside dropdown or modal
  const handleOutsideClick = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsProfileOpen(false);
    }
    if (
      modalOpen &&
      bellRef.current &&
      !bellRef.current.contains(event.target) &&
      !event.target.closest("#discount-modal")
    ) {
      setModalOpen(false);
    }
  };

  useEffect(() => {
    if (isProfileOpen || modalOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isProfileOpen, modalOpen]);

  // 🔔 Handle bell click
  const handleBellClick = () => {
    setModalOpen((prev) => {
      const newState = !prev;
      if (newState) {
        localStorage.setItem(LAST_SEEN_COUNT_KEY, notifications.length.toString());
        setNotificationCount(0);
      }
      return newState;
    });
  };

  const getBranchLink = (baseLink) =>
    selectedBranch ? `${baseLink}?branchId=${selectedBranch}` : baseLink;

  return (
    <header className="bg-[#F4F9FD] border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between p-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>

          <div className="lg:hidden">
            <h1 className="text-xl font-bold text-gray-800">Sinfode Admin</h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">

          {/* 🔔 Discount Request Bell */}
          <div
            ref={bellRef}
            className="relative cursor-pointer text-gray-700 hover:text-gray-900 transition-colors"
            onClick={handleBellClick}
            aria-label="Discount Requests"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleBellClick()}
          >
            <HiBell size={22} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {notificationCount}
              </span>
            )}

            {/* Notification Modal */}
            {modalOpen && (
              <div
                id="discount-modal"
                className="absolute right-0 mt-2 w-96 max-h-96 bg-white rounded-lg shadow-lg overflow-y-auto border border-gray-300 z-50"
                style={{ top: "calc(100% + 6px)" }}
              >
                <div className="p-5">
                  <h2 className="text-xl font-semibold mb-4">Pending Discount Requests</h2>

                  {notifications.length === 0 ? (
                    <p className="text-gray-500 italic">No pending requests.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {notifications.slice(0, 2).map((req) => (
                        <li key={req.id} className="py-3">
                          <h3 className="font-semibold text-gray-900">
                            Branch: {req.branch?.branch_name}
                          </h3>
                          <p className="text-sm text-gray-700">
                            Requested by: {req.requester?.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Current:{" "}
                            {req.current_range
                              ? `${req.current_range}%`
                              : req.current_amount}
                            {" → "}
                            Requested:{" "}
                            {req.requested_range
                              ? `${req.requested_range}%`
                              : req.requested_amount}
                          </p>
                          <p className="text-xs text-yellow-600 mt-1 font-medium">
                            Status: Pending
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex justify-end mt-4">
                    <button
                      className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      onClick={() => {
                        setModalOpen(false);
                        navigate("/sinfodeadmin/discount");
                      }}
                    >
                      View All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 👤 Profile Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
                <img
                  src="https://sipl.ind.in/wp-content/uploads/2022/07/dummy-user.png"
                  alt="Admin Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-gray-700 font-medium">
                  {user?.name || "Admin"}
                </span>
                <span className="text-xs text-gray-500">
                  {user?.role || "Role"}
                </span>
              </div>

              <HiChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  to="/sinfodeadmin/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsProfileOpen(false)}
                >
                  👤 Profile Settings
                </Link>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Adminheader;