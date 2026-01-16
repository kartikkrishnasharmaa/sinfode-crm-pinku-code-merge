import React, { useState, useEffect } from 'react';
import axios from "../../../api/axiosConfig";
import './Collection.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const Collection = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [feeRecords, setFeeRecords] = useState([]);
  const [filteredFeeRecords, setFilteredFeeRecords] = useState([]);
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(''); 
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedFeeRecord, setSelectedFeeRecord] = useState(null);
  const [selectedPaymentHistory, setSelectedPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [feeStructures, setFeeStructures] = useState([]);
  const [pendingInstallments, setPendingInstallments] = useState([]);
  const [selectedStudentForReminder, setSelectedStudentForReminder] = useState(null);
  const [reminderTiming, setReminderTiming] = useState('before_7_days');
  
  // New state for filtering and sorting
  const [filters, setFilters] = useState({
    studentName: '',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: 'asc'
  });

  const [formData, setFormData] = useState({
    total_fee: '',
    due_date: '',
    paid_amount: '',
    discount: '',
    penalty: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash',
    amount_paid: '',
    note: ''
  });

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  useEffect(() => {
    const fetchFeeStructures = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/fee-structures", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeeStructures(res.data || []);
      } catch (error) {
        console.error("Error fetching fee structures:", error);
      }
    };
    fetchFeeStructures();
  }, []);

  // Function to open reminder modal
  const openReminderModal = (feeRecord) => {
    setSelectedStudentForReminder(feeRecord.student);
    
    // Find fee structures for this student
    const studentFeeStructures = feeStructures.filter(
      fs => fs.student_id === feeRecord.student.id
    );
    
    // Extract all installments
    const allInstallments = studentFeeStructures.flatMap(fs => 
      fs.installments.map(inst => ({
        ...inst,
        fee_type: fs.fee_type,
        course_id: fs.course_id
      }))
    );  
    // Filter pending installments (those with due dates in the future or recently passed)
    const today = new Date();
    const pending = allInstallments.filter(inst => {
      const dueDate = new Date(inst.due_date);
      // Consider installments due in the future or up to 7 days past due
      return dueDate >= new Date(today.setDate(today.getDate() - 7));
    });
    
    setPendingInstallments(pending);
    setShowReminderModal(true);
  };

  // Fetch all fee records
  useEffect(() => {
    const fetchFeeRecords = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/studentfee", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Filter fee records by user's branch ID
        const filteredRecords = res.data.filter(record => 
          record.student && record.student.branch_id === userBranchId
        );
        
        setFeeRecords(filteredRecords || []);
        setFilteredFeeRecords(filteredRecords || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching fee records:", error);
        setLoading(false);
      }
    };
    fetchFeeRecords();
  }, [userBranchId]);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/courses/index", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Filter courses by user's branch ID
        const filteredCourses = res.data.filter(course => 
          course.branch_id === userBranchId
        );
        
        setCourses(filteredCourses || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, [userBranchId]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/courses/${selectedCourse}/show`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Filter students by user's branch ID
        const filteredStudents = (res.data.students || []).filter(student => 
          student.branch_id === userBranchId
        );
        
        setStudents(filteredStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [selectedCourse, userBranchId]);

  // Apply filters and sorting whenever filters, sortConfig, or feeRecords change
  useEffect(() => {
    let result = [...feeRecords];

    // Apply name filter
    if (filters.studentName) {
      result = result.filter(record =>
        record.student?.full_name?.toLowerCase().includes(filters.studentName.toLowerCase())
      );
    }

    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter(record => {
        const recordDate = new Date(record.created_at || record.due_date);
        const fromDate = new Date(filters.dateFrom);
        return recordDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      result = result.filter(record => {
        const recordDate = new Date(record.created_at || record.due_date);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire end date
        return recordDate <= toDate;
      });
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(record => {
        if (filters.status === 'paid') return record.pending_amount === 0;
        if (filters.status === 'pending') return record.pending_amount > 0;
        if (filters.status === 'advance') return record.pending_amount < 0;
        return true;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'student_name':
            aValue = a.student?.full_name?.toLowerCase() || '';
            bValue = b.student?.full_name?.toLowerCase() || '';
            break;
          case 'total_fee':
            aValue = parseFloat(a.total_fee) || 0;
            bValue = parseFloat(b.total_fee) || 0;
            break;
          case 'paid_amount':
            aValue = parseFloat(a.paid_amount) || 0;
            bValue = parseFloat(b.paid_amount) || 0;
            break;
          case 'pending_amount':
            aValue = parseFloat(a.pending_amount) || 0;
            bValue = parseFloat(b.pending_amount) || 0;
            break;
          case 'due_date':
            aValue = new Date(a.due_date || a.created_at);
            bValue = new Date(b.due_date || b.created_at);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredFeeRecords(result);
  }, [filters, sortConfig, feeRecords]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle sort requests
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      studentName: '',
      dateFrom: '',
      dateTo: '',
      status: 'all'
    });
    setSortConfig({
      key: '',
      direction: 'asc'
    });
  };
const getCourseNamesFromRecord = (feeRecord) => {
  if (!feeRecord || !feeRecord.student) return "N/A";

  const courses = feeRecord.student.courses;

  if (Array.isArray(courses) && courses.length > 0) {
    return courses.map(course => course.course_name).join(", ");
  }

  return "N/A";
};
 
  const generateReceipt = (payment, feeRecord) => {
     const doc = new jsPDF("p", "mm", "a4");
 
     const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '';
     const formatAmount = (a) => Number(a || 0).toString();
     const numberToWords = (num) => {
       if (num === 0) return "Zero";
 
       const a = [
         "", "One", "Two", "Three", "Four", "Five", "Six",
         "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
         "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
         "Eighteen", "Nineteen"
       ];
 
       const b = [
         "", "", "Twenty", "Thirty", "Forty", "Fifty",
         "Sixty", "Seventy", "Eighty", "Ninety"
       ];
 
       const inWords = (n) => {
         if (n < 20) return a[n];
         if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
         if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
         if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
         if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
         return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
       };
 
       return inWords(num) + " Rupees Only";
     };
 
 
     const logo = "https://i.postimg.cc/c4S3VP48/sinfode-seal.png";
 
     const pageWidth = doc.internal.pageSize.getWidth();
     const margin = 10;
 
 
     // EXACT HALF A4 HEIGHT
     const RECEIPT_HEIGHT = 148; // A4 → 297 / 2 = 148.5 (rounded)
 
     // DRAW A RECEIPT
     const drawReceipt = (startY) => {
       let y = startY;
 
       // TOP BORDER
       doc.line(0, y, pageWidth, y);
       y += 10;
       // HEADER
       y += 3;   // halka sa top margin
       doc.setFont("helvetica", "bold");
       doc.setFontSize(20);
       doc.text("FEE RECEIPT", margin, y);
 
       // ----- RIGHT SIDE TEXT -----
       doc.setFont("helvetica", "normal");
       doc.setFontSize(12);
       doc.text(`Admission No.: ${feeRecord?.student?.admission_number || ''}`, pageWidth - 90, y);
       y += 8;
       doc.text(`Date: ${formatDate(payment?.payment_date)}`, pageWidth - 90, y);
 
       y += 10;
 
       // ------ Horizontal line below header ------
       doc.line(margin, y, pageWidth - margin, y);
       y += 12;
 
       // --------- CENTER VERTICAL LINE ---------
       const centerX = pageWidth / 2;
       doc.line(centerX, y - 40, centerX, y - 12);
       // adjust Y range as needed
 
 
       // STUDENT DETAILS
       // Name of Student
       doc.setFont("helvetica", "bold");
       doc.text("Name of Student :", margin, y);
 
       doc.setFont("helvetica", "normal");
       doc.text(`${feeRecord?.student?.full_name || ''}`, margin + 40, y);
 
       y += 7;
 
       // Guardian Name
       doc.setFont("helvetica", "bold");
       doc.text("Guardian Name :", margin, y);
 
       doc.setFont("helvetica", "normal");
       doc.text(`${feeRecord?.student?.guardian_name || ''}`, margin + 40, y);
 
       y += 7;
 
       // Name of Course
       doc.setFont("helvetica", "bold");
       doc.text("Name of Course :", margin, y);
 
       doc.setFont("helvetica", "normal");
       doc.text(`${getCourseNamesFromRecord(feeRecord)}`, margin + 40, y);
 
       y += 7;
 
 
       doc.line(margin, y, pageWidth - margin, y);
       y += 14;
 
       // PAID AMOUNT
       doc.setFont("helvetica", "bold");
       doc.text("Paid Amount :", margin, y);
       doc.setFont("helvetica", "italic");
       doc.text(numberToWords(Number(payment?.amount_paid || 0)), margin + 35, y);
 
       // AMOUNT BOX (Border Only)
       doc.rect(pageWidth - 70, y - 6, 60, 16, "S"); // <-- "F" removed, replaced by "S"
 
       doc.setFont("helvetica", "bold");
       doc.setFontSize(16);
       doc.text(`Rs. ${formatAmount(payment?.amount_paid)}`, pageWidth - 65, y + 3);
 
       y += 18;
 
       doc.line(margin, y, pageWidth - margin, y);
       y += 14;
 
       // COURSE INFO
       doc.setFont("helvetica", "normal");
       doc.setFontSize(12);
 
       doc.text(`Student Sign :  ${payment?.received_by || ''}`, margin, y);
       doc.text(`Payment Mode :  ${payment?.payment_mode || ''}`, pageWidth - 120, y);
 
       // SIGN SEAL BOX
       // SIGN & SEAL BOX (tighter, shifted upward)
       doc.rect(pageWidth - 60, y - 8, 50, 20);  // was y - 12 (shifted UP) and height 25 → 20 (less height)
       doc.setFont("helvetica", "bold");
       doc.text("Sign & Seal", pageWidth - 55, y + 1); // was y + 2 (moved UP)
       y += 22; // was 28 (reduced bottom spacing)
 
 
       // FOOTER BLACK STRIP (reduced height = 24)
       const footerHeight = 24;
       const blackY = startY + RECEIPT_HEIGHT - footerHeight;
 
       doc.setFillColor(0, 0, 0);
       doc.rect(0, blackY, pageWidth, footerHeight, "F");
 
       // LOGO
       doc.addImage(logo, "PNG", margin, blackY + 3, 18, 18);
 
       // FOOTER TEXT (tightly packed)
       doc.setTextColor(255, 255, 255);
 
       // Company Name
       doc.setFontSize(14);
       doc.text("SINFODE PRIVATE LIMITED", pageWidth / 2, blackY + 8, { align: "center" });
 
       // Contact Row
       doc.setFontSize(8);
       doc.text(
         "www.sinfode.com | info@sinfode.com | +91-9676306970",
         pageWidth / 2,
         blackY + 14,
         { align: "center" }
       );
 
       // Address Row
       doc.text(
         "Opp. Sanskrit College, Near Kalyan Circle, Sikar - 332001 (Raj.)",
         pageWidth / 2,
         blackY + 20,
         { align: "center" }
       );
 
       doc.setTextColor(0, 0, 0);
 
     };
 
     // FIRST RECEIPT — TOP HALF
     drawReceipt(0);
 
     // SECOND RECEIPT — EXACTLY BELOW FIRST
     drawReceipt(RECEIPT_HEIGHT);
 
     const studentNameSafe = (feeRecord?.student?.full_name || "student").replace(/\s+/g, "_");
     doc.save(`Fee_Receipt_${studentNameSafe}_${payment?.id}.pdf`);
   };
  // Helper function to get branch name
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.branch_name : 'N/A';
  };

  // Helper function to calculate previous balance
  const calculatePreviousBalance = (feeRecord, currentPayment) => {
    const paymentIndex = feeRecord.payments.findIndex(p => p.id === currentPayment.id);
    let previousBalance = feeRecord.total_fee;
    
    for (let i = 0; i < paymentIndex; i++) {
      previousBalance -= parseFloat(feeRecord.payments[i].amount_paid);
    }
    
    return previousBalance;
  };

  // Helper function to calculate current balance
  const calculateCurrentBalance = (feeRecord, currentPayment) => {
    const paymentIndex = feeRecord.payments.findIndex(p => p.id === currentPayment.id);
    let currentBalance = feeRecord.total_fee;
    
    for (let i = 0; i <= paymentIndex; i++) {
      currentBalance -= parseFloat(feeRecord.payments[i].amount_paid);
    }
    
    return currentBalance;
  };

  // Filter students by branch
  const filteredStudents = students.filter(
    (s) => !selectedBranch || s.branch_id?.toString() === selectedBranch
  );

  const closeModal = () => {
    setShowModal(false);
  };

  const openPaymentModal = (feeRecord) => {
    setSelectedFeeRecord(feeRecord);
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: 'cash',
      amount_paid: '',
      note: ''
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedFeeRecord(null);
  };

  const openPaymentHistoryModal = (feeRecord) => {
    setSelectedFeeRecord(feeRecord);
    setSelectedPaymentHistory(feeRecord.payments || []);
    setShowPaymentHistoryModal(true);
  };

  const closePaymentHistoryModal = () => {
    setShowPaymentHistoryModal(false);
    setSelectedFeeRecord(null);
    setSelectedPaymentHistory([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm({
      ...paymentForm,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const dataToSubmit = {
        student_id: selectedStudent,
        course_name: selectedCourse,
        total_fee: formData.total_fee,
        due_date: formData.due_date,
        paid_amount: formData.paid_amount,
        discount: formData.discount,
        penalty: formData.penalty
      };

      const res = await axios.post('/studentfee', dataToSubmit, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh the fee records
      const feeRes = await axios.get("/studentfee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const filteredRecords = feeRes.data.filter(record => 
        record.student && record.student.branch_id === userBranchId
      );
      
      setFeeRecords(filteredRecords || []);
      setFilteredFeeRecords(filteredRecords || []);
      
      toast.success("Fee record saved successfully!");
      closeModal();
    } catch (error) {
      console.error("Error saving fee data:", error);
      toast.error("Error saving fee data. Please try again.");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFeeRecord) {
      toast.error("No fee record selected");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const dataToSubmit = {
        student_fee_id: selectedFeeRecord.id,
        payment_date: paymentForm.payment_date,
        payment_mode: paymentForm.payment_mode,
        amount_paid: paymentForm.amount_paid,
        note: paymentForm.note
      };

      await axios.post('/student-fee-payments', dataToSubmit, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh the fee records with branch filtering
      const feeRes = await axios.get("/studentfee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Filter fee records by user's branch ID
      const filteredRecords = feeRes.data.filter(record => 
        record.student && record.student.branch_id === userBranchId
      );
      
      setFeeRecords(filteredRecords || []);
      setFilteredFeeRecords(filteredRecords || []);
      toast.success("Payment recorded successfully!");
      closePaymentModal();
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error("Error saving payment. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (pendingAmount) => {
    if (pendingAmount === 0) {
      return <span className="status-badge paid">Paid</span>;
    } else if (pendingAmount > 0) {
      return <span className="status-badge pending">Pending</span>;
    } else {
      return <span className="status-badge advance">Advance</span>;
    }
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return <div className="loading">Loading fee records...</div>;
  }

  return (
    <div className="collection-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="collection-header">
        <h1>Fee Collection Management</h1>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon total">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="stat-info">
            <h3>{feeRecords.length}</h3>
            <p>Total Fee Records</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon paid">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{feeRecords.filter(r => r.pending_amount === 0).length}</h3>
            <p>Fully Paid</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{feeRecords.filter(r => r.pending_amount > 0).length}</h3>
            <p>Pending Payments</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon advance">
            <i className="fas fa-plus-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{feeRecords.filter(r => r.pending_amount < 0).length}</h3>
            <p>Advance Payments</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <h3>Filters & Sorting</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Student Name:</label>
            <input
              type="text"
              placeholder="Search by student name..."
              value={filters.studentName}
              onChange={(e) => handleFilterChange('studentName', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Date From:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Date To:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="advance">Advance</option>
            </select>
          </div>

          <button className="bg-blue-600 border border-x-white text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="table-container">
        <h2>Fee Records ({filteredFeeRecords.length} records found)</h2>
        <div className="table-responsive">
          <table className="fee-table">
            <thead>
              <tr>
                <th>#</th>
                <th 
                  className="sortable" 
                >
                  Student Name
                </th>
                <th 
                  className="sortable" 
                >
                  Total Fee                </th>
                <th 
                  className="sortable" 
                >
                  Paid Amount
                </th>
                <th 
                  className="sortable" 
                >
                  Pending Amount
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeeRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">No fee records found</td>
                </tr>
              ) : (
                filteredFeeRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td className="serial-number">{index + 1}</td>
                    <td className='text-bold'>
                      {record.student?.full_name}
                    </td>
                    <td>{formatCurrency(record.total_fee)}</td>
                    <td>{formatCurrency(record.paid_amount)}</td>
                    <td>{formatCurrency(record.pending_amount)}</td>
                    <td>{getStatusBadge(record.pending_amount)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => openPaymentModal(record)} 
                          className="btn btn-sm btn-primary"
                        >
                          Pay
                        </button>
                        
                        {record.payments && record.payments.length > 0 && (
                          <button 
                            onClick={() => openPaymentHistoryModal(record)}
                            className="btn btn-sm btn-info payment-history-btn"
                            title="View Payment History"
                          >
                            <i className="fas fa-history"></i> 
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rest of the modal code remains the same */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Fee Collection</h3>
              <button onClick={closeModal} className="modal-close">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Branch</label>
                  <select 
                    value={selectedBranch} 
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Course</label>
                  <select 
                    value={selectedCourse} 
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">Select Course</option>
                    {courses
                      .filter(course => !selectedBranch || course.branch_id?.toString() === selectedBranch)
                      .map(course => (
                        <option key={course.id} value={course.id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Student</label>
                <select 
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                >
                  <option value="">Select Student</option>
                  {filteredStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Fee (₹)</label>
                  <input 
                    type="number" 
                    name="total_fee"
                    value={formData.total_fee}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Paid Amount (₹)</label>
                  <input 
                    type="number" 
                    name="paid_amount"
                    value={formData.paid_amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Discount (₹)</label>
                  <input 
                    type="number" 
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Penalty (₹)</label>
                  <input 
                    type="number" 
                    name="penalty"
                    value={formData.penalty}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Fee Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Other modals (Payment, Payment History, Reminder) remain exactly the same */}
      {showReminderModal && selectedStudentForReminder && (
        <div className="modal-backdrop">
          <div className="modal reminder-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-bell"></i> 
                Send Fee Reminder to {selectedStudentForReminder.full_name}
              </h3>
              <button onClick={() => setShowReminderModal(false)} className="modal-close">
                &times;
              </button>
            </div>
            
            <div className="reminder-content">
              <div className="timing-selection">
                <h4>Reminder Timing</h4>
                <div className="timing-options">
                  <label className="timing-option">
                    <input 
                      type="radio" 
                      name="reminderTiming" 
                      value="before_7_days"
                      checked={reminderTiming === 'before_7_days'}
                      onChange={(e) => setReminderTiming(e.target.value)}
                    />
                    <span className="timing-label">
                      <i className="fas fa-calendar-minus"></i>
                      7 Days Before Due Date
                    </span>
                  </label>
                  
                  <label className="timing-option">
                    <input 
                      type="radio" 
                      name="reminderTiming" 
                      value="on_due_date"
                      checked={reminderTiming === 'on_due_date'}
                      onChange={(e) => setReminderTiming(e.target.value)}
                    />
                    <span className="timing-label">
                      <i className="fas fa-calendar-day"></i>
                      On Due Date
                    </span>
                  </label>
                  
                  <label className="timing-option">
                    <input 
                      type="radio" 
                      name="reminderTiming" 
                      value="after_4_days"
                      checked={reminderTiming === 'after_4_days'}
                      onChange={(e) => setReminderTiming(e.target.value)}
                    />
                    <span className="timing-label">
                      <i className="fas fa-calendar-plus"></i>
                      4 Days After Due Date
                    </span>
                  </label>
                </div>
              </div>

              <div className="pending-installments">
                <h4>Pending Installments</h4>
                {pendingInstallments.length === 0 ? (
                  <p className="no-installments">No pending installments found.</p>
                ) : (
                  <div className="installments-list">
                    {pendingInstallments.map(installment => (
                      <div key={installment.id} className="installment-item">
                        <div className="installment-info">
                          <div className="installment-number">
                            Installment #{installment.installment_number}
                          </div>
                          <div className="installment-details">
                            <span className="amount">{formatCurrency(installment.amount)}</span>
                            <span className="due-date">
                              Due: {formatDate(installment.due_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => setShowReminderModal(false)} 
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedFeeRecord && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Payment for {selectedFeeRecord.student?.full_name}</h3>
              <button onClick={closePaymentModal} className="modal-close">
                &times;
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Date</label>
                  <input 
                    type="date" 
                    name="payment_date"
                    value={paymentForm.payment_date}
                    onChange={handlePaymentInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Mode</label>
                  <select 
                    name="payment_mode"
                    value={paymentForm.payment_mode}
                    onChange={handlePaymentInputChange}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Amount Paid (₹)</label>
                <input 
                  type="number" 
                  name="amount_paid"
                  value={paymentForm.amount_paid}
                  onChange={handlePaymentInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Note</label>
                <textarea 
                  name="note"
                  value={paymentForm.note}
                  onChange={handlePaymentInputChange}
                  rows="3"
                />
              </div>

              <div className="payment-summary">
                <p><strong>Total Fee:</strong> {formatCurrency(selectedFeeRecord.total_fee)}</p>
                <p><strong>Already Paid:</strong> {formatCurrency(selectedFeeRecord.paid_amount)}</p>
                <p><strong>Pending Amount:</strong> {formatCurrency(selectedFeeRecord.pending_amount)}</p>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closePaymentModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentHistoryModal && selectedFeeRecord && (
        <div className="modal-backdrop">
          <div className="modal payment-history-modal">
            <div className="modal-header">
              <h3>Payment History for {selectedFeeRecord.student?.full_name}</h3>
              <button onClick={closePaymentHistoryModal} className="modal-close">
                &times;
              </button>
            </div>
            
            <div className="payment-history-content">
              <div className="fee-summary">
                <h4>Fee Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Total Fee:</label>
                    <span>{formatCurrency(selectedFeeRecord.total_fee)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Paid Amount:</label>
                    <span>{formatCurrency(selectedFeeRecord.paid_amount)}</span>
                  </div>
                  <div className="summary-item">
                    <label>Pending Amount:</label>
                    <span>{formatCurrency(selectedFeeRecord.pending_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="payment-history-list">
                <h4>Payment Transactions</h4>
                {selectedPaymentHistory.length === 0 ? (
                  <p className="no-payments">No payments recorded yet.</p>
                ) : (
                  <div className="payment-table-container">
                    <table className="payment-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Mode</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPaymentHistory.map((payment, index) => (
                          <tr key={payment.id}>
                            <td className="serial-number">{index + 1}</td>
                            <td>{formatDate(payment.payment_date)}</td>
                            <td>{formatCurrency(payment.amount_paid)}</td>
                            <td>
                              <span className={`payment-mode ${payment.payment_mode}`}>
                                {payment.payment_mode}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn-download-receipt"
                                onClick={() => generateReceipt(payment, selectedFeeRecord)}
                                title="Download Receipt"
                              >
                                <i className="fas fa-download"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={closePaymentHistoryModal} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collection;
