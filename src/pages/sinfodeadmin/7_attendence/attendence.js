import SAAdminLayout from "../../../layouts/Sinfodeadmin";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import AllView from "./view";
import StaffAttendance from "./staffattendence";
import ViewStaffAttendance from "./viewstaff";
import { toast, ToastContainer } from "react-toastify";

function AddAttendance() {
  const [branches, setBranches] = useState([])
  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  // Fetch all branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/branches", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(res.data || []);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranches();
  }, []);

  // Fetch courses when branch is selected
  useEffect(() => {
    const fetchCoursesByBranch = async () => {
      if (!selectedBranch) {
        setCourses([]);
        setSelectedCourse("");
        setAllStudents([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/courses/index", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Filter courses by selected branch
        const branchCourses = res.data.filter(course => 
          course.branch_id?.toString() === selectedBranch
        );
        
        setCourses(branchCourses || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      }
    };

    fetchCoursesByBranch();
  }, [selectedBranch]);

  // Fetch students when course is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse || !selectedBranch) {
        setAllStudents([]);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/students/show", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter students by selected branch and course
        const filteredStudents = res.data.filter(student => 
          student.branch_id?.toString() === selectedBranch &&
          student.courses?.some(course => course.id.toString() === selectedCourse)
        );

        setAllStudents(filteredStudents || []);
      } catch (error) {
        console.error("Error fetching students:", error);
        setAllStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedCourse, selectedBranch]);

  const markAttendance = (id, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const markAllPresent = () => {
    const allPresent = {};
    allStudents.forEach((student) => {
      allPresent[student.id] = "Present";
    });
    setAttendanceData(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    allStudents.forEach((student) => {
      allAbsent[student.id] = "Absent";
    });
    setAttendanceData(allAbsent);
  };

  const clearAllAttendance = () => {
    setAttendanceData({});
  };

  const saveAttendance = async () => {
    if (Object.keys(attendanceData).length === 0) {
      toast.warn("⚠️ Please mark attendance for at least one student");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      // Send attendance one by one
      for (const [studentId, status] of Object.entries(attendanceData)) {
        await axios.post(
          "/attendance/store",
          {
            attendance: {
              student_id: parseInt(studentId),
              date,
              status,
              reason: null,
            },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success(" Attendance saved successfully!");
      setAttendanceData({});
    } catch (err) {
      console.error(err);
      toast.error(" Error saving attendance");
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance stats
  const presentCount = Object.values(attendanceData).filter(status => status === "Present").length;
  const absentCount = Object.values(attendanceData).filter(status => status === "Absent").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white flex items-center justify-between shadow-lg border-b-4 border-indigo-600 mb-6 rounded-xl px-6 py-4">
        <div>
          <h1 className="text-[30px] mb-2 font-nunito">Student Attendance</h1>
          <p className="text-white text-lg">Today: {new Date(date).toLocaleDateString('en-IN')}</p>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-90">Marked: {presentCount + absentCount} / {allStudents.length}</div>
          <div className="text-sm opacity-90">Present: {presentCount} | Absent: {absentCount}</div>
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="bg-white shadow-md rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Branch Dropdown - First Priority */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">Select Branch *</label>
          <select
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedCourse(""); // Reset course when branch changes
              setAttendanceData({}); // Clear attendance data
            }}
          >
            <option value="">-- Select Branch --</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch_name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Dropdown - Depends on Branch */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">Select Course *</label>
          <select
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setAttendanceData({}); // Clear attendance data
            }}
            disabled={!selectedBranch}
          >
            <option value="">-- Select Course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_name} ({course.course_code})
              </option>
            ))}
          </select>
        </div>

        {/* Date Picker */}
        <div>
          <label className="block mb-2 font-medium text-gray-700">Select Date</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Statistics and Info */}
      {selectedCourse && selectedBranch && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{allStudents.length}</div>
              <div className="text-sm text-blue-800">Total Students</div>
            </div>
          
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{allStudents.length - (presentCount + absentCount)}</div>
              <div className="text-sm text-purple-800">Pending</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      {allStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={markAllPresent}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
            >
              ✅ Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
            >
              ❌ Mark All Absent
            </button>
            <button
              onClick={clearAllAttendance}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center gap-2"
            >
              🗑️ Clear All
            </button>
            <button
              onClick={saveAttendance}
              disabled={loading || Object.keys(attendanceData).length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {loading ? "⏳ Saving..." : "💾 Save Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading students...</p>
        </div>
      ) : allStudents.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            {allStudents.map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                  attendanceData[student.id] === "Present"
                    ? "border-green-200 bg-green-50"
                    : attendanceData[student.id] === "Absent"
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {/* Student Info */}
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {student.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {student.full_name}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-1">
                      <span>Admission: #{student.admission_number}</span>
                      <span>Branch: {student.branch?.branch_name}</span>
                      <span>Contact: {student.contact_number}</span>
                      <span>Course: {student.courses?.[0]?.course_name}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => markAttendance(student.id, "Present")}
                    className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 min-w-[100px] ${
                      attendanceData[student.id] === "Present"
                        ? "bg-green-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 border-2 border-green-200"
                    }`}
                  >
                    ✅ Present
                  </button>
                  <button
                    onClick={() => markAttendance(student.id, "Absent")}
                    className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 min-w-[100px] ${
                      attendanceData[student.id] === "Absent"
                        ? "bg-red-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 border-2 border-red-200"
                    }`}
                  >
                    ❌ Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selectedBranch && selectedCourse ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No students found
          </h3>
          <p className="text-gray-500">
            No students are enrolled in this course for the selected branch
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">👨‍🎓</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {!selectedBranch ? "Select a Branch to Continue" : "Select a Course to View Students"}
          </h3>
          <p className="text-gray-500">
            {!selectedBranch 
              ? "Choose a branch from the dropdown above to start marking attendance" 
              : "Choose a course from the dropdown to view students"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Attendance() {
  const [activeTab, setActiveTab] = useState("addAttendance");
  
  const tabs = [
    { id: "addAttendance", label: "➕ Add Student Attendance", },
    { id: "attendanceList", label: "📋 View Student Attendance", },
    { id: "staffAttendance", label: "➕ Staff Attendance", },
    { id: "viewStaffAttendance", label: "📋 View Staff Attendance", },
  ];

  return (
    <SAAdminLayout>
      <div className="flex flex-col lg:flex-row h-full gap-6">
        {/* Sidebar */}
        <div className="lg:w-80 bg-white rounded-xl shadow-md p-4 space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-4 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                  : "hover:bg-blue-50 text-gray-700 border border-gray-200"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 rounded-lg p-4 lg:p-6 overflow-y-auto bg-gray-50">
          {activeTab === "addAttendance" && <AddAttendance />}
          {activeTab === "attendanceList" && <AllView />}
          {activeTab === "staffAttendance" && <StaffAttendance />}
          {activeTab === "viewStaffAttendance" && <ViewStaffAttendance />}
        </div>
      </div>
    </SAAdminLayout>
  );
}