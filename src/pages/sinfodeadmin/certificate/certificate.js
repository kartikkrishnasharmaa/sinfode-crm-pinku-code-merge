import SAAdminLayout from "../../../layouts/Sinfodeadmin";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import Upload from "./upload";
import Issued from "./issued";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function Certificate() {
  const [activeTab, setActiveTab] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SAAdminLayout>
      <div className="flex h-full relative">
        {/* Mobile sidebar toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed top-20 left-4 bg-white p-3 rounded-full shadow-lg border border-gray-200"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>

        {/* Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl p-6 space-y-2 transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 md:static md:shadow-none`}
        >
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Certificate Management</h2>
          </div>
          
          <button
            onClick={() => setActiveTab("upload")}
            className={`w-full text-left px-4 py-4 rounded-xl transition duration-200 ${
              activeTab === "upload"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            ➕ Upload Certificate
          </button>

          <button
            onClick={() => setActiveTab("issued")}
            className={`w-full text-left px-4 py-4 rounded-xl transition duration-200 ${
              activeTab === "issued"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            📋 Issue Certificate
          </button>
          
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 rounded-lg p-6 overflow-y-auto bg-gray-50">
          {activeTab === "upload" && <Upload />}
          {activeTab === "issued" && <Issued />}
        </div>
      </div>
    </SAAdminLayout>
  );
}

