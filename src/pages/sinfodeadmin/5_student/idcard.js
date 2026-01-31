import React, { useState, useEffect, useRef } from "react";
import axios from "../../../api/axiosConfig";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  FaIdCard,
  FaTimes,
  FaSearch,
  FaUsers,
  FaUserGraduate,
  FaBook,
  FaEnvelope,
  FaPhone,
  FaBuilding,
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

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get("/branches", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBranches(res.data || []));

    axios.get("/courses/index", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCourses(res.data || []));

    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/students/show", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data || []);
      setFilteredStudents(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER LOGIC ---------------- */

  useEffect(() => {
    let data = students;

    if (selectedBranch) {
      data = data.filter(s => s.branch_id?.toString() === selectedBranch);
    }

    if (selectedCourse) {
      data = data.filter(s =>
        s.courses?.some(c => c.id.toString() === selectedCourse)
      );
    }

    if (searchTerm) {
      data = data.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_number?.includes(searchTerm)
      );
    }

    setFilteredStudents(data);
  }, [selectedBranch, selectedCourse, searchTerm, students]);

  /* ---------------- ACTIONS ---------------- */

  const handleGenerateIDCard = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  const handleDownloadPDF = async () => {
    if (!idCardRef.current) return;
    setDownloading(true);

    const canvas = await html2canvas(idCardRef.current, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "mm", [85.6, 54]);
    pdf.addImage(imgData, "PNG", 0, 0, 85.6, 54);
    pdf.save(`ID_${selectedStudent.admission_number}.pdf`);

    setDownloading(false);
  };

  const handleDownloadImage = async () => {
    if (!idCardRef.current) return;
    setDownloading(true);

    const canvas = await html2canvas(idCardRef.current, { scale: 3, useCORS: true });
    const link = document.createElement("a");
    link.download = `ID_${selectedStudent.admission_number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    setDownloading(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Student ID Card Generator</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search student..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6 p-3 w-full border rounded"
      />

      {/* STUDENT LIST */}
      {loading ? (
        <div className="text-center py-10 text-lg font-semibold text-gray-600">
          Loading students...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              {/* TOP BANNER */}
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 h-24">
                <img
                  src={
                    student.photo_url ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt={student.full_name}
                  className="w-20 h-20 rounded-xl object-cover border-4 border-white absolute left-4 -bottom-10 shadow-lg bg-white"
                />

                {/* STATUS BADGE */}
                <span
                  className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full ${student.enrollment_status === "Active"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                    }`}
                >
                  {student.enrollment_status}
                </span>
              </div>

              {/* CONTENT */}
              <div className="pt-14 px-5 pb-6">
                <h3 className="text-lg font-bold text-gray-800 truncate">
                  {student.full_name}
                </h3>

                <p className="text-sm text-gray-500 mb-3">
                  Admission ID: <span className="font-semibold">{student.admission_number}</span>
                </p>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Course</span>
                    <span className="text-right truncate max-w-[140px]">
                      {student.courses?.[0]?.course_name || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Branch</span>
                    <span>
                      {student.branch?.branch_name || "N/A"}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <button
                  onClick={() => handleGenerateIDCard(student)}
                  className="mt-5 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 rounded-xl font-semibold transition-all duration-300 transform group-hover:scale-[1.02]"
                >
                  🎫 Generate ID Card
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* MODAL */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-xl p-6 relative">
            <button onClick={closeModal} className="absolute top-3 right-3">
              <FaTimes />
            </button>

            {/* ID CARD */}
            <div className="flex justify-center mb-6">
              <div
                ref={idCardRef}
                className="w-[340px] h-[215px] border rounded-xl overflow-hidden bg-white shadow"
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm px-4 py-2 font-bold">
                  STUDENT ID CARD
                </div>

                <div className="flex p-3 gap-3 text-xs">
                  <img
                    src={selectedStudent.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt="student"
                    className="w-20 h-24 object-cover border rounded"
                  />

                  <div className="space-y-1">
                    <p><b>Name:</b> {selectedStudent.full_name}</p>
                    <p><b>ID:</b> {selectedStudent.admission_number}</p>
                    <p><b>Course:</b> {selectedStudent.courses?.[0]?.course_name || "N/A"}</p>
                    <p><b>Branch:</b> {selectedStudent.branch?.branch_name || "N/A"}</p>
                    <p><b>Phone:</b> {selectedStudent.contact_number}</p>
                  </div>
                </div>

                <div className="text-[10px] text-center bg-gray-100 py-1">
                  Valid for Academic Use Only
                </div>
              </div>
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="bg-red-500 text-white px-9 py-2 rounded"
              >
                <FaFilePdf /> PDF
              </button>

              <button
                onClick={handleDownloadImage}
                disabled={downloading}
                className="bg-blue-500 text-white px-9 py-2 rounded"
              >
                <FaImage /> Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentIDCardGenerator;
