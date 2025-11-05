import SAAdminLayout from "../../../layouts/Sinfodeadmin";
import { useState } from "react";
import FeesStructure from "./structure";
import Collection from "./collection";
import Reminder from "./remider";

export default function Fees() {
  const [activeTab, setActiveTab] = useState("fees");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SAAdminLayout>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50 relative overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-20 left-4 z-50 bg-white shadow-lg p-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
          aria-label="Toggle Sidebar"
        >
          {sidebarOpen ? "❌" : "☰"}
        </button>

        {/* Sidebar */}
        <div
          className={`fixed md:static top-0 left-0 h-full w-64 bg-white shadow-lg rounded-r-xl transform transition-transform duration-300 ease-in-out z-40
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <div className="pt-24 md:pt-6 p-4 space-y-3 overflow-y-auto h-full">
            <button
              onClick={() => setActiveTab("fees")}
              className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition
                ${
                  activeTab === "fees"
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
            >
              💰 Fees Structure
            </button>

            <button
              onClick={() => setActiveTab("collection")}
              className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition
                ${
                  activeTab === "collection"
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-blue-50 text-gray-700"
                }`}
            >
              💳 Fees Collection
            </button>

            <button
              onClick={() => setActiveTab("reminder")}
              className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition
                ${
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
            className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto mt-24 md:mt-0">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            {activeTab === "fees" && <FeesStructure />}
            {activeTab === "collection" && <Collection />}
            {activeTab === "reminder" && <Reminder />}
          </div>
        </div>
      </div>
    </SAAdminLayout>
  );
}
