import SAAdminLayout from "../../../layouts/Sinfodeadmin";
import { useState } from "react";
import FeesStructure from "./structure";
import Collection from "./collection";
import Reminder from "./remider";

export default function Fees() {
  const [activeTab, setActiveTab] = useState("fees");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Match Adminheader height
  const NAVBAR_HEIGHT = "64px";

  return (
    <SAAdminLayout>
      {/* Main wrapper */}
      <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-[72px] left-4 z-50 bg-white shadow-lg p-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? "❌" : "☰"}
        </button>

        {/* Sidebar */}
        <div
          className={`
            bg-white shadow-lg md:shadow-none rounded-r-xl md:rounded-none
            transform transition-transform duration-300 ease-in-out
            md:translate-x-0 fixed md:static
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{
            top: NAVBAR_HEIGHT,
            height: `calc(100vh - ${NAVBAR_HEIGHT})`,
            width: "16rem", // 64 Tailwind
            zIndex: 30,
          }}
        >
          <div className="p-4 space-y-3 overflow-y-auto h-full border-r border-gray-200">
            <button
              onClick={() => setActiveTab("fees")}
              className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                activeTab === "fees"
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-blue-50 text-gray-700"
              }`}
            >
              💰 Fees Structure
            </button>

            <button
              onClick={() => setActiveTab("collection")}
              className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                activeTab === "collection"
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-blue-50 text-gray-700"
              }`}
            >
              💳 Fees Collection
            </button>

            <button
              onClick={() => setActiveTab("reminder")}
              className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                activeTab === "reminder"
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-blue-50 text-gray-700"
              }`}
            >
              ⏰ Fee Reminder
            </button>
          </div>
        </div>

        {/* Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main
          className="flex-1 p-4 overflow-y-auto"
          // style={{ marginTop: NAVBAR_HEIGHT }}
        >
          <div className="bg-white rounded-xl shadow-sm p-4">
            {activeTab === "fees" && <FeesStructure />}
            {activeTab === "collection" && <Collection />}
            {activeTab === "reminder" && <Reminder />}
          </div>
        </main>
      </div>
    </SAAdminLayout>
  );
}
