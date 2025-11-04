import React, { useState, useEffect, useRef } from "react";
import axios from "../../../api/axiosConfig";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  FaPrint,
  FaDownload,
  FaTimes,
  FaSearch,
  FaFilter,
  FaUserGraduate,
  FaIdCard,
  FaUsers,
  FaBook,
  FaBuilding,
  FaEye,
  FaQrcode,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFilePdf,
  FaImage
} from "react-icons/fa";

function StudentIDCardGenerator() {
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const idCardRef = useRef(null);

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

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/courses/index", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  // Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/students/show", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data || []);
      setFilteredStudents(res.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on selections
  useEffect(() => {
    let filtered = students;

    // Filter by branch
    if (selectedBranch) {
      filtered = filtered.filter(student =>
        student.branch_id?.toString() === selectedBranch
      );
    }

    // Filter by course
    if (selectedCourse) {
      filtered = filtered.filter(student =>
        student.courses?.some(course => course.id.toString() === selectedCourse)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [selectedBranch, selectedCourse, searchTerm, students]);

  // Handle Generate ID Card
  const handleGenerateIDCard = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  // Handle Print
  const handlePrint = () => {
    const printContent = document.getElementById("id-card-to-print");
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID Card - ${selectedStudent.full_name}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: 'Arial', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .id-card-container {
              transform: scale(1.1);
            }
            @media print {
              body { 
                background: white !important;
                padding: 0;
              }
              .id-card-container {
                transform: none !important;
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Handle Download as PDF
  const handleDownloadPDF = async () => {
    if (!idCardRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(idCardRef.current, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', [54, 85.6]); // ID card size in mm (CR80 standard)

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ID_Card_${selectedStudent.admission_number}_${selectedStudent.full_name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Handle Download as Image
  const handleDownloadImage = async () => {
    if (!idCardRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(idCardRef.current, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: null
      });

      const link = document.createElement('a');
      link.download = `ID_Card_${selectedStudent.admission_number}_${selectedStudent.full_name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error downloading image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setDownloading(false);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedBranch("");
    setSelectedCourse("");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <FaIdCard className="text-3xl text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student ID Card Generator
            </h1>
            <p className="text-gray-600 mt-2">Generate professional ID cards for your students</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Students</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, admission number, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Branch Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-300 appearance-none"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-300 appearance-none"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Students</p>
                    <p className="text-xl font-bold text-gray-800">{filteredStudents.length}</p>
                  </div>
                  <FaUsers className="text-blue-500" />
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Students</p>
                    <p className="text-xl font-bold text-gray-800">
                      {filteredStudents.filter(s => s.enrollment_status === 'Active').length}
                    </p>
                  </div>
                  <FaUserGraduate className="text-green-500" />
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Available Courses</p>
                    <p className="text-xl font-bold text-gray-800">{courses.length}</p>
                  </div>
                  <FaBook className="text-purple-500" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-gray-400 transition-colors font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Student List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student, index) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200 overflow-hidden group transform hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Student Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={student.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt={student.full_name}
                        className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${student.enrollment_status === "Active" ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{student.full_name}</h3>
                      <p className="text-blue-100 text-sm truncate">#{student.admission_number}</p>
                      <div className="flex items-center gap-2 mt-1">

                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.enrollment_status === "Active"
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                          }`}>
                          {student.enrollment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Details */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaEnvelope className="text-gray-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaPhone className="text-gray-400" />
                      <span>{student.contact_number}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FaBuilding className="text-gray-400" />
                      <span>{student.branch?.branch_name}</span>
                    </div>
                  </div>


                </div>

                {/* Action Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => handleGenerateIDCard(student)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <FaIdCard className="text-sm" />
                    Generate ID Card
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserGraduate className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Students Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCourse || selectedBranch
                  ? "Try adjusting your search criteria or filters"
                  : "No students available for ID card generation"
                }
              </p>
              {(searchTerm || selectedCourse || selectedBranch) && (
                <button
                  onClick={resetFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ID Card Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 transform animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white z-10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <FaIdCard className="text-xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Student ID Card</h2>
                  <p className="text-gray-600 text-sm">Preview and print ID card</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-xl"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6">
              <div id="id-card-to-print" ref={idCardRef} className="id-card-container mx-auto">
                {/* ID Card Design */}
                <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl overflow-hidden w-96 mx-auto border-8 border-white">
                  {/* College Header */}
                  <div className="bg-white bg-opacity-90 backdrop-blur-sm p-4 text-center border-b border-white border-opacity-20">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <img
                        src="https://www.sinfode.com/wp-content/uploads/2022/12/digital-marketing-institute-in-sikar.webp"
                        alt="College Logo"
                        className="w-auto h-auto rounded-lg"
                      />

                    </div>
                  </div>

                  {/* Student Photo and Basic Info */}
                  <div className="p-6">
                    <div className="flex gap-6 items-start">
                      {/* Student Photo */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            src={selectedStudent.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt={selectedStudent.full_name}
                            className="w-24 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                          />
                          <div className="absolute inset-0 border-2 border-white border-opacity-50 rounded-2xl"></div>
                        </div>
                        <div className="mt-2 text-center">
                          <div className="bg-white bg-opacity-20 rounded-lg px-2 py-1">
                            <span className="text-white text-xs font-bold">ID: #{selectedStudent.admission_number}</span>
                          </div>
                        </div>
                      </div>

                      {/* Student Details */}
                      <div className="flex-1 text-white">
                        <h2 className="text-xl font-bold mb-2 leading-tight">
                          {selectedStudent.full_name.toUpperCase()}
                        </h2>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <FaUsers className="text-white text-opacity-80" />
                            <span className="font-medium">Father:</span>
                            <span>{selectedStudent.guardian_name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-white text-opacity-80" />
                            <span className="font-medium">Branch:</span>
                            <span>{selectedStudent.branch?.branch_name}</span>
                          </div>

                          {selectedStudent.courses?.[0] && (
                            <div className="flex items-center gap-2">
                              <FaBook className="text-white text-opacity-80" />
                              <span className="font-medium">Course:</span>
                              <span
                                className="truncate max-w-[120px] overflow-hidden whitespace-nowrap"
                                title={selectedStudent.courses[0].course_name}
                              >
                                {selectedStudent.courses[0].course_name}
                              </span>
                            </div>
                          )}


                          {selectedStudent.courses?.[0]?.batch && (
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-white text-opacity-80" />
                              <span className="font-medium">Batch:</span>
                              <span>{selectedStudent.courses[0].batch.batch_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* QR Code Area */}
                    <div className="mt-6 pt-4 border-t border-white border-opacity-20">
                      <div className="flex justify-between items-center">
                        <div className="text-white text-xs">
                          <div>Valid Through: {formatDate(selectedStudent.courses?.[0]?.batch?.end_date)}</div>
                          <div className="text-white text-opacity-70">Authorized Signature</div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-black bg-opacity-30 p-3 text-center">
                    <p className="text-white text-opacity-80 text-xs">
                      {selectedStudent.branch?.address || "Near Kalyan Circle, Front of Sanskrit College, Sikar (Rajasthan)"}
                    </p>
                    <p className="text-white text-opacity-60 text-xs mt-1">
                      Contact: {selectedStudent.branch?.contact_number || "9376306970"} | Email: {selectedStudent.branch?.email || "info@sinfode.com"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Printing Instructions:</h4>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Ensure the ID card is centered on the page</li>
                  <li>Use high-quality photo paper for best results</li>
                  <li>Check printer settings for correct size (CR80 - 3.375" x 2.125")</li>
                </ul>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 via-white to-gray-100 border-t border-gray-300 px-6 py-4 flex justify-end">
              {/* Download Options Dropdown */}
              {!downloading && (
                <div className="flex gap-4">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl shadow-md bg-gradient-to-r from-red-100 to-red-50 hover:from-red-200 hover:to-red-100 text-gray-800 font-semibold transition-all duration-300 border border-red-200"
                  >
                    <FaFilePdf className="text-red-600 text-xl" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    className="flex items-center gap-3 px-5 py-3 rounded-xl shadow-md bg-gradient-to-r from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 text-gray-800 font-semibold transition-all duration-300 border border-blue-200"
                  >
                    <FaImage className="text-blue-600 text-xl" />
                    <span>Download Image</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default StudentIDCardGenerator;