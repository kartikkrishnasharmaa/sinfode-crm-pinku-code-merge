import React, { useState, useEffect } from 'react';
import axios from "../../../api/axiosConfig";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Collection = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [feeRecords, setFeeRecords] = useState([]);
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');

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

  useEffect(() => {
    const fetchFeeRecords = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/studentfee", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeeRecords(res.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching fee records:", error);
        setLoading(false);
      }
    };
    fetchFeeRecords();
  }, []);

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

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/courses/${selectedCourse}/show`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(res.data.students || []);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [selectedCourse]);

  const getFilteredAndSortedRecords = () => {
    let filtered = feeRecords.filter(record => {
      const matchesSearch = record.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.student?.admission_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'paid' && record.pending_amount === 0) ||
                           (statusFilter === 'pending' && record.pending_amount > 0) ||
                           (statusFilter === 'advance' && record.pending_amount < 0);
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.student?.full_name?.toLowerCase() || '';
          bValue = b.student?.full_name?.toLowerCase() || '';
          break;
        case 'total_fee':
          aValue = parseFloat(a.total_fee);
          bValue = parseFloat(b.total_fee);
          break;
        case 'paid_amount':
          aValue = parseFloat(a.paid_amount);
          bValue = parseFloat(b.paid_amount);
          break;
        case 'pending_amount':
          aValue = parseFloat(a.pending_amount);
          bValue = parseFloat(b.pending_amount);
          break;
        case 'due_date':
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
          break;
        default:
          aValue = a.student?.full_name?.toLowerCase() || '';
          bValue = b.student?.full_name?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  const generateReceipt = (payment, feeRecord) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    doc.setFillColor(63, 81, 181);
    doc.rect(0, 0, pageWidth, 60, 'F');

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('SINFODE INSTITUTE', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255, 255);
    doc.setFont(undefined, 'normal');
    doc.text('Quality Education for Better Future', pageWidth / 2, 35, { align: 'center' });

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, 70, contentWidth, 15, 'F');
    doc.setFontSize(16);
    doc.setTextColor(63, 81, 181);
    doc.text('FEE PAYMENT RECEIPT', pageWidth / 2, 80, { align: 'center' });

    const receiptDetailsY = 95;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, receiptDetailsY, contentWidth, 35, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Receipt No: ${payment.id}`, margin + 10, receiptDetailsY + 10);
    doc.text(`Date: ${formatDate(payment.payment_date)}`, margin + 10, receiptDetailsY + 20);
    doc.text(`Payment Mode: ${payment.payment_mode.toUpperCase()}`, pageWidth - margin - 10, receiptDetailsY + 10, { align: 'right' });
    doc.text(`Status: PAID`, pageWidth - margin - 10, receiptDetailsY + 20, { align: 'right' });

    const studentInfoY = receiptDetailsY + 45;
    doc.setFontSize(12);
    doc.setTextColor(63, 81, 181);
    doc.text('STUDENT INFORMATION', margin, studentInfoY);

    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, studentInfoY + 5, contentWidth, 40, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Name: ${feeRecord.student.full_name}`, margin + 10, studentInfoY + 15);
    doc.text(`Admission No: ${feeRecord.student.admission_number}`, margin + 10, studentInfoY + 25);
    doc.text(`Contact: ${feeRecord.student.contact_number}`, margin + contentWidth / 2, studentInfoY + 15);
    doc.text(`Email: ${feeRecord.student.email}`, margin + contentWidth / 2, studentInfoY + 25);

    const paymentInfoY = studentInfoY + 55;
    doc.setFontSize(12);
    doc.setTextColor(63, 81, 181);
    doc.text('PAYMENT DETAILS', margin, paymentInfoY);

    doc.autoTable({
      startY: paymentInfoY + 10,
      head: [['Description', 'Amount (₹)']],
      body: [
        ['Total Fee', formatCurrency(feeRecord.total_fee)],
        ['Amount Paid', formatCurrency(payment.amount_paid)],
        ['Previous Balance', formatCurrency(calculatePreviousBalance(selectedFeeRecord, payment))],
        ['Current Balance', formatCurrency(calculateCurrentBalance(selectedFeeRecord, payment))]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      margin: { left: margin, right: margin }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(63, 81, 181);
    doc.setDrawColor(63, 81, 181);
    doc.roundedRect(margin, finalY, contentWidth, 15, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL AMOUNT PAID: ${formatCurrency(payment.amount_paid)}`, pageWidth / 2, finalY + 10, { align: 'center' });

    if (payment.note) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Notes: ${payment.note}`, margin, finalY + 25);
    }

    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your payment!', pageWidth / 2, finalY + 40, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer generated receipt. No signature required.', pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    doc.save(`Fee_Receipt_${feeRecord.student.full_name}_${payment.id}.pdf`);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.branch_name : 'N/A';
  };

  const calculatePreviousBalance = (feeRecord, currentPayment) => {
    const paymentIndex = feeRecord.payments.findIndex(p => p.id === currentPayment.id);
    let previousBalance = feeRecord.total_fee;

    for (let i = 0; i < paymentIndex; i++) {
      previousBalance -= parseFloat(feeRecord.payments[i].amount_paid);
    }

    return previousBalance;
  };

  const calculateCurrentBalance = (feeRecord, currentPayment) => {
    const paymentIndex = feeRecord.payments.findIndex(p => p.id === currentPayment.id);
    let currentBalance = feeRecord.total_fee;

    for (let i = 0; i <= paymentIndex; i++) {
      currentBalance -= parseFloat(feeRecord.payments[i].amount_paid);
    }

    return currentBalance;
  };

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
      alert("Please select a student");
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
      const feeRes = await axios.get("/studentfee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeeRecords(feeRes.data || []);
      alert("Fee record saved successfully!");
      closeModal();
    } catch (error) {
      console.error("Error saving fee data:", error);
      alert("Error saving fee data. Please try again.");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFeeRecord) {
      alert("No fee record selected");
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
      const feeRes = await axios.get("/studentfee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeeRecords(feeRes.data || []);
      alert("Payment recorded successfully!");
      closePaymentModal();
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Error saving payment. Please try again.");
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
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Paid</span>;
    } else if (pendingAmount > 0) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>;
    } else {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Advance</span>;
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-600">Loading fee records...</div>;
  }

  const filteredRecords = getFilteredAndSortedRecords();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fee Collection Management</h1>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 flex items-center hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-receipt text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{feeRecords.length}</h3>
              <p className="text-gray-600 text-sm font-medium">Total Fee Records</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 flex items-center hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-check-circle text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{feeRecords.filter(r => r.pending_amount === 0).length}</h3>
              <p className="text-gray-600 text-sm font-medium">Fully Paid</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 flex items-center hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-clock text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{feeRecords.filter(r => r.pending_amount > 0).length}</h3>
              <p className="text-gray-600 text-sm font-medium">Pending Payments</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 flex items-center hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
              <i className="fas fa-plus-circle text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{feeRecords.filter(r => r.pending_amount < 0).length}</h3>
              <p className="text-gray-600 text-sm font-medium">Advance Payments</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                placeholder="Search by student name or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="advance">Advance</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="name">Sort by Name</option>
                <option value="total_fee">Sort by Total Fee</option>
                <option value="paid_amount">Sort by Paid Amount</option>
                <option value="pending_amount">Sort by Pending Amount</option>
                <option value="due_date">Sort by Due Date</option>
              </select>

              <button 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors duration-200 font-semibold"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Fee Records ({filteredRecords.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                  
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  >
                    Student Name 
                  </th>
                  <th 
                    
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  >
                    Total Fee 
                  </th>
                  <th 
                   
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  >
                    Paid Amount 
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  >
                    Pending Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
                        <p className="text-lg">No fee records found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.student?.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.total_fee)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.paid_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.pending_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.pending_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPaymentModal(record)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors duration-200 ${
                              record.pending_amount === 0 
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                            disabled={record.pending_amount === 0}
                          >
                            {record.pending_amount === 0 ? 'Paid' : 'Pay'}
                          </button>

                          {record.payments && record.payments.length > 0 && (
                            <button
                              onClick={() => openPaymentHistoryModal(record)}
                              className="px-3 py-1 bg-teal-500 text-white rounded text-xs font-semibold hover:bg-teal-600 transition-colors duration-200"
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

        {/* Add Fee Collection Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Add Fee Collection</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  >
                    <option value="">Select Student</option>
                    {filteredStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Fee (₹)</label>
                    <input
                      type="number"
                      name="total_fee"
                      value={formData.total_fee}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount (₹)</label>
                    <input
                      type="number"
                      name="paid_amount"
                      value={formData.paid_amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₹)</label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Penalty (₹)</label>
                    <input
                      type="number"
                      name="penalty"
                      value={formData.penalty}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                  >
                    Save Fee Collection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedFeeRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Add Payment for {selectedFeeRecord.student?.full_name}</h3>
                <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  &times;
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                    <input
                      type="date"
                      name="payment_date"
                      value={paymentForm.payment_date}
                      onChange={handlePaymentInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                    <select
                      name="payment_mode"
                      value={paymentForm.payment_mode}
                      onChange={handlePaymentInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid (₹)</label>
                  <input
                    type="number"
                    name="amount_paid"
                    value={paymentForm.amount_paid}
                    onChange={handlePaymentInputChange}
                    step="0.01"
                    min="0"
                    max={selectedFeeRecord.pending_amount}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                  <small className="text-gray-500 text-sm">Maximum: {formatCurrency(selectedFeeRecord.pending_amount)}</small>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                  <textarea
                    name="note"
                    value={paymentForm.note}
                    onChange={handlePaymentInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm mb-2"><strong>Total Fee:</strong> {formatCurrency(selectedFeeRecord.total_fee)}</p>
                  <p className="text-sm mb-2"><strong>Already Paid:</strong> {formatCurrency(selectedFeeRecord.paid_amount)}</p>
                  <p className="text-sm"><strong>Pending Amount:</strong> {formatCurrency(selectedFeeRecord.pending_amount)}</p>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={closePaymentModal}
                    className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment History Modal */}
        {showPaymentHistoryModal && selectedFeeRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Payment History for {selectedFeeRecord.student?.full_name}</h3>
                <button onClick={closePaymentHistoryModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  &times;
                </button>
              </div>

              <div className="p-6">
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Fee Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-gray-600 mb-1 font-medium">Total Fee</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedFeeRecord.total_fee)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-gray-600 mb-1 font-medium">Paid Amount</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedFeeRecord.paid_amount)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-gray-600 mb-1 font-medium">Pending Amount</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedFeeRecord.pending_amount)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Transactions</h4>
                  {selectedPaymentHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No payments recorded yet.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedPaymentHistory.map(payment => (
                            <tr key={payment.id}>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(payment.payment_date)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(payment.amount_paid)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  payment.payment_mode === 'cash' ? 'bg-green-100 text-green-800' :
                                  payment.payment_mode === 'online' ? 'bg-blue-100 text-blue-800' :
                                  payment.payment_mode === 'cheque' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {payment.payment_mode}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => generateReceipt(payment, selectedFeeRecord)}
                                  className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition-colors duration-200"
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

              <div className="flex justify-end p-6 border-t border-gray-200">
                <button 
                  onClick={closePaymentHistoryModal}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
