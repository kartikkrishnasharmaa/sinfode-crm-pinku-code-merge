import SAManager from "../../../layouts/StaffLayout";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import Allstudents from "./allstudents";
import Idcard from "./idcard";
import AcademicProgress from "./academic";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function Student() {
  const [activeTab, setActiveTab] = useState("studentList");
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = userData.role;
  const isBranchManager = userRole === "branch_manager";
  const branchId = userData.branch_id;

  return (
    <SAManager>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl shadow-lg p-6 space-y-3">
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Student Management</h2>
          </div>
          <button
            onClick={() => setActiveTab("studentList")}
            className={`w-full text-left px-4 py-4 rounded-xl transition duration-200 ${
              activeTab === "studentList"
                ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                : "hover:bg-gray-100 text-gray-700 border border-transparent"
            }`}
          >
            📋 All Students
          </button>
          
          <button
            onClick={() => setActiveTab("idCard")}
            className={`w-full text-left px-4 py-4 rounded-xl transition duration-200 ${
              activeTab === "idCard"
                ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                : "hover:bg-gray-100 text-gray-700 border border-transparent"
            }`}
          >
           📋  ID Cards
          </button>
          
          <button
            onClick={() => setActiveTab("academic")}
            className={`w-full text-left px-4 py-4 rounded-xl transition duration-200 ${
              activeTab === "academic"
                ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                : "hover:bg-gray-100 text-gray-700 border border-transparent"
            }`}
          >
            📊 Academic Progress
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 rounded-lg p-6 overflow-y-auto bg-gray-50">
          {activeTab === "studentList" && (
            <Allstudents 
              isBranchManager={isBranchManager} 
              branchId={isBranchManager ? branchId : null} 
            />
          )}
          {activeTab === "idCard" && (
            <Idcard 
              isBranchManager={isBranchManager} 
              branchId={isBranchManager ? branchId : null} 
            />
          )}
          {activeTab === "academic" && (
            <AcademicProgress 
              isBranchManager={isBranchManager} 
              branchId={isBranchManager ? branchId : null} 
            />
          )}
        </div>
      </div>
    </SAManager>
  );
}