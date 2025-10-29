import SAManager from "../../../layouts/Sinfodemanager";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import Allstudents from "./allstudents";
import Idcard from "./idcard";
import AcademicProgress from "./academic";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AddStudent() {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState(null);
  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Multiple courses and batches selection
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseBatches, setCourseBatches] = useState({});
  
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courseFee, setCourseFee] = useState(0);
  const [finalFee, setFinalFee] = useState(0);
  
  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = userData.role;
  const branch_id = userData.branch_id;

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch courses for this branch only
    axios
      .get("/courses/index", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Filter courses by branch_id if needed
        const branchCourses = res.data.filter(course => course.branch_id == branch_id);
        setCourses(branchCourses || []);
      })
      .catch(error => {
        console.error("Failed to fetch courses:", error);
        toast.error("Failed to fetch courses");
      });

    // Fetch batches for this branch only
    axios
      .get("/batches/show", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const batchList = Array.isArray(res.data)
          ? res.data
          : res.data.data || [];
        // Filter batches by branch_id
        const branchBatches = batchList.filter(batch => batch.branch_id == branch_id);
        setBatches(branchBatches);
      })
      .catch(error => {
        console.error("Failed to fetch batches:", error);
        toast.error("Failed to fetch batches");
      });
  }, [branch_id]);

  // Calculate total fee when courses change
  useEffect(() => {
    if (selectedCourses.length > 0) {
      let totalFee = 0;
      selectedCourses.forEach(courseId => {
        const course = courses.find(c => c.id == courseId);
        if (course) {
          const fee = parseFloat(
            course.discounted_price || course.actual_price || 0
          );
          totalFee += fee;
        }
      });
      setCourseFee(totalFee);
      setFinalFee(totalFee);
    } else {
      setCourseFee(0);
      setFinalFee(0);
    }
  }, [selectedCourses, courses]);

  const handleCourseSelection = (courseId) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        // Remove course and its batch
        const newCourseBatches = { ...courseBatches };
        delete newCourseBatches[courseId];
        setCourseBatches(newCourseBatches);
        return prev.filter(id => id !== courseId);
      } else {
        // Add course
        return [...prev, courseId];
      }
    });
  };

  const handleBatchSelection = (courseId, batchId) => {
    setCourseBatches(prev => ({
      ...prev,
      [courseId]: batchId
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  // Validation
  if (selectedCourses.length === 0) {
    toast.error("❌ Please select at least one course");
    setLoading(false);
    return;
  }

  // Check if all selected courses have batches assigned
  const missingBatches = selectedCourses.filter(courseId => !courseBatches[courseId]);
  if (missingBatches.length > 0) {
    toast.error("❌ Please select batches for all selected courses");
    setLoading(false);
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    // Basic student info
    formData.append("full_name", fullName);
    formData.append("dob", dob);
    formData.append("gender", gender);
    formData.append("contact_number", contactNumber);
    formData.append("email", email);
    formData.append("address", address);
    if (photo) formData.append("photo", photo);
    formData.append("guardian_name", guardianName);
    formData.append("guardian_contact", guardianContact);
    formData.append("admission_date", admissionDate);
    formData.append("branch_id", branch_id);

    // Course and batch data - FIXED: Use course_ids[] and batch_ids[] arrays
    selectedCourses.forEach(courseId => {
      formData.append("course_ids[]", courseId);
    });

    // Add batch_ids in the same order as course_ids
    selectedCourses.forEach(courseId => {
      formData.append("batch_ids[]", courseBatches[courseId]);
    });

    formData.append("course_fee", courseFee);
    formData.append("final_fee", finalFee);

    console.log("Submitting student data:", {
      fullName,
      courses: selectedCourses,
      batches: courseBatches,
      totalFee: finalFee
    });

    // Log FormData contents for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const response = await axios.post("/students/create", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Student created successfully:", response.data);
    toast.success("✅ Student created successfully!");
    
    // Reset form
    resetForm();
    
  } catch (error) {
    console.error("Error creating student:", error);
    if (error.response?.data?.message) {
      toast.error(`❌ ${error.response.data.message}`);
    } else if (error.response?.data?.errors) {
      Object.values(error.response.data.errors).flat().forEach((msg) => 
        toast.error(`❌ ${msg}`)
      );
    } else {
      toast.error("❌ Failed to create student");
    }
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFullName("");
    setDob("");
    setGender("");
    setContactNumber("");
    setEmail("");
    setAddress("");
    setPhoto(null);
    setGuardianName("");
    setGuardianContact("");
    setAdmissionDate("");
    setSelectedCourses([]);
    setCourseBatches({});
    setCourseFee(0);
    setFinalFee(0);
  };

  // Get batches for a specific course
  const getBatchesForCourse = (courseId) => {
    return batches.filter(batch => 
      batch.course_id == courseId || 
      (batch.courses && batch.courses.some(course => course.id == courseId))
    );
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="p-6 w-full bg-[#F4F9FD]">
      <ToastContainer position="bottom-center" autoClose={3000} />
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Add New Student</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter student's full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Date of Birth *
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Contact Number *
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setContactNumber(value);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10-digit mobile number"
                maxLength={10}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="student@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Student Photo
              </label>
              <input
                type="file"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept="image/*"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter complete address"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Guardian Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Guardian Name
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter guardian's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Guardian Contact
              </label>
              <input
                type="text"
                value={guardianContact}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setGuardianContact(value);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Course Selection */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Course Enrollment</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {selectedCourses.length} course(s) selected
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                  selectedCourses.includes(course.id) 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={`course-${course.id}`}
                    checked={selectedCourses.includes(course.id)}
                    onChange={() => handleCourseSelection(course.id)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <label 
                      htmlFor={`course-${course.id}`}
                      className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 block text-sm"
                    >
                      {course.course_name}
                    </label>
                    
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Code:</span> {course.course_code}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Duration:</span> {course.duration} months
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Mode:</span> 
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                          course.mode === 'Online' ? 'bg-green-100 text-green-800' :
                          course.mode === 'Offline' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {course.mode}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Level:</span> {course.course_level}
                      </p>
                    </div>

                    <div className="mt-3">
                      <span className="text-lg font-bold text-green-600">
                        ₹{course.discounted_price || course.actual_price || "0"}
                      </span>
                    </div>
                    
                    {/* Batch selection for selected courses */}
                    {selectedCourses.includes(course.id) && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                          Select Batch *
                        </label>
                        <select
                          value={courseBatches[course.id] || ""}
                          onChange={(e) => handleBatchSelection(course.id, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Choose a batch</option>
                          {getBatchesForCourse(course.id).map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batch_name} 
                              {batch.batch_start_time && ` (${formatTime(batch.batch_start_time)})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Selected Courses Summary */}
          {selectedCourses.length > 0 && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Enrollment Summary</h3>
              <div className="space-y-3">
                {selectedCourses.map(courseId => {
                  const course = courses.find(c => c.id == courseId);
                  const batch = batches.find(b => b.id == courseBatches[courseId]);
                  return course ? (
                    <div key={courseId} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{course.course_name}</div>
                        {batch && (
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Batch:</span> {batch.batch_name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ₹{course.discounted_price || course.actual_price || "0"}
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
                <div className="border-t border-blue-200 pt-3 mt-2">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span className="text-gray-800">Total Fee:</span>
                    <span className="text-blue-600">₹{finalFee}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admission Details */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Admission Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Admission Date *
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Total Course Fee
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4">
                <div className="text-2xl font-bold text-green-600 text-center">
                  ₹{finalFee}
                </div>
                <div className="text-sm text-gray-600 text-center mt-1">
                  Total for {selectedCourses.length} course(s)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={resetForm}
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-200 font-medium"
            disabled={loading}
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={loading || selectedCourses.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-semibold"
          >
            {loading ? "Creating Student..." : "Add Student"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Student() {
  const [activeTab, setActiveTab] = useState("addStudent");
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
            onClick={() => setActiveTab("addStudent")}
            className={`w-full text-left px-4 py-4 rounded-xl transition duration-200 ${
              activeTab === "addStudent"
                ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                : "hover:bg-gray-100 text-gray-700 border border-transparent"
            }`}
          >
            ➕ Add Student
          </button>

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
          {activeTab === "addStudent" && <AddStudent />}
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