import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { HiBell } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";

const Managerheader = ({ toggleSidebar }) => {
  const [isOpen, setIsOpen] = useState(false); // profile dropdown toggle
  const [notificationCount, setNotificationCount] = useState(0);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const selectedBranch = useSelector((state) => state.branch.selectedBranch);
  const navigate = useNavigate();

  // Helper key for localStorage
  const LAST_SEEN_COUNT_KEY = "lastSeenNotificationCount";

  // Fetch branch-specific unread notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.branch_id) return;

      const response = await axios.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const branchUnread = response.data.unread_communication.filter(
          (n) => Number(n.branch_id) === Number(user.branch_id) && n.is_read === 0
        );

        setNotifications(branchUnread);

        const storedLastSeenCountRaw = localStorage.getItem(LAST_SEEN_COUNT_KEY);
        const storedLastSeenCount = storedLastSeenCountRaw ? Number(storedLastSeenCountRaw) : 0;

        // Show badge count only if new notifications arrived after last seen
        const newCount = branchUnread.length > storedLastSeenCount
          ? branchUnread.length - storedLastSeenCount
          : 0;

        setNotificationCount(newCount);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Close dropdown/modal on outside click
  const handleOutsideClick = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
    if (
      modalOpen &&
      bellRef.current &&
      !bellRef.current.contains(event.target) &&
      !event.target.closest("#notification-modal")
    ) {
      setModalOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen || modalOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, modalOpen]);

  // Handle bell icon click - open/close modal and update last seen count if opening
  const handleBellClick = () => {
    setModalOpen((prev) => {
      const newState = !prev;
      if (newState) {
        // Update last seen count in localStorage to current total unread count
        localStorage.setItem(LAST_SEEN_COUNT_KEY, notifications.length.toString());
        // Badge count resets to zero visually
        setNotificationCount(0);
      }
      return newState;
    });
  };

  return (
    <header className="bg-[#f9fafb] flex items-center justify-between relative z-50 px-6 py-3 shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Left side can hold logo or other nav items if needed */}
        <div>{/* Placeholder for left nav content or logo */}</div>

        {/* Right side: Notification Bell and Profile */}
        <div className="flex items-center space-x-8 text-gray-800 text-lg font-semibold">

          {/* Notification Bell */}
          <div
            className="relative cursor-pointer text-gray-700 hover:text-gray-900 transition-colors"
            onClick={handleBellClick}
            ref={bellRef}
            aria-label="Notifications"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleBellClick()}
          >
            <HiBell className="w-7 h-7" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold select-none">
                {notificationCount}
              </span>
            )}

            {/* Notification Modal */}
            {modalOpen && (
              <div
                id="notification-modal"
                className="absolute right-0 mt-2 w-96 max-h-96 bg-white rounded-lg shadow-lg overflow-y-auto border border-gray-300 z-50 ring-1 ring-black ring-opacity-5"
                style={{ top: "calc(100% + 6px)" }}
              >
                <div className="p-5">
                  <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                  <span className="text-sm">Latest Notification</span>
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 italic">No unread notifications.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      <div
                        onClick={() => {
                          setModalOpen(false);
                          navigate("/sinfodemanager/communication");
                        }}
                      >
                        {/* Only take the first two notifications */}
                        {notifications.slice(0, 2).map((n) => (
                          <li key={n.id} className="py-3">
                            <h3 className="font-semibold text-gray-900">{n.title}</h3>
                            <p className="text-sm text-gray-700">{n.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Priority: <span className="font-medium">{n.priority}</span>{" "}
                              | Type: <span className="font-medium">{n.type}</span>
                            </p>
                          </li>
                        ))}
                      </div>
                    </ul>
                  )}
                  <div className="flex justify-end mt-6 space-x-3">

                    <button
                      className="px-3 py-1.5 text-sm font-medium bg-blue-600 rounded text-white hover:bg-blue-700 transition"
                      onClick={() => {
                        setModalOpen(false);
                        navigate("/sinfodemanager/communication");
                      }}
                    >
                      View All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div ref={dropdownRef} className="relative">
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="flex bg-white items-center gap-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setIsOpen(!isOpen)}
              aria-haspopup="true"
              aria-expanded={isOpen}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300">
                <img
                  src="https://sipl.ind.in/wp-content/uploads/2022/07/dummy-user.png"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-gray-700 font-medium">{user?.name || "Admin"}</span>
                <span className="text-xs text-gray-500">{user?.role || "Role"}</span>
              </div>
            </div>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg overflow-hidden animate-fadeIn ring-1 ring-black ring-opacity-5">
                <Link to="/sinfodemanager/profile">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Profile</button>
                </Link>
                <button
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Managerheader;
