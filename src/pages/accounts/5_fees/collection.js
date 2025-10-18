import React, { useState, useEffect, useMemo } from 'react';
import axios from "../../../api/axiosConfig";
import './Collection.css';
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
  const [feeStructures, setFeeStructures] = useState([]);

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

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userBranchId = userData.branch_id;

  // Additional state for sorting and filtering
  const [sortConfig, setSortConfig] = useState({ key: 'studentName', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState({
    searchText: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch Fee Structures
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

  // Fetch fee records filtered by user's branch
  useEffect(() => {
    const fetchFeeRecords = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/studentfee", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filteredRecords = res.data.filter(record =>
          record.student && record.student.branch_id === userBranchId
        );
        setFeeRecords(filteredRecords || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching fee records:", error);
        setLoading(false);
      }
    };
    fetchFeeRecords();
  }, [userBranchId]);

  // Fetch Courses filtered by branch ID
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/courses/index", {
          headers: { Authorization: `Bearer ${token}` },
        });

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

  // Fetch students by selected course filtered by branch ID
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/courses/${selectedCourse}/show`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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

  // Filter students by selectedBranch and selectedCourse
  const filteredStudents = students.filter(
    (s) => !selectedBranch || s.branch_id?.toString() === selectedBranch
  );

  // Sorting and Filtering fee records with memoization for performance
  const processedFeeRecords = useMemo(() => {
    let records = [...feeRecords].map(record => ({
      ...record,
      studentName: record.student?.full_name || '',
      dueDate: record.due_date || '',
      status: record.pending_amount === 0 ? 'Paid' : (record.pending_amount > 0 ? 'Pending' : 'Advance'),
    }));

    // Filtering
    if (filterConfig.searchText.trim() !== '') {
      const searchLower = filterConfig.searchText.trim().toLowerCase();
      records = records.filter(record =>
        record.studentName.toLowerCase().includes(searchLower) ||
        (record.student?.admission_number || '').toLowerCase().includes(searchLower)
      );
    }
    if (filterConfig.status) {
      records = records.filter(record => record.status.toLowerCase() === filterConfig.status.toLowerCase());
    }
    if (filterConfig.dateFrom) {
      const fromDate = new Date(filterConfig.dateFrom);
      records = records.filter(record => record.dueDate && new Date(record.dueDate) >= fromDate);
    }
    if (filterConfig.dateTo) {
      const toDate = new Date(filterConfig.dateTo);
      records = records.filter(record => record.dueDate && new Date(record.dueDate) <= toDate);
    }

    // Sorting
    if (sortConfig.key) {
      records.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Support for different data types
        if (sortConfig.key === 'dueDate') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return records;
  }, [feeRecords, filterConfig, sortConfig]);

  // Functions for sorting when clicking headers
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Utility functions as is
  const generateReceipt = (payment, feeRecord) => {
    // The existing generateReceipt function implementation unchanged for brevity ...
    // [Omitted here for brevity but keep your original exactly as it was]
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

  const closeModal = () => setShowModal(false);
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle Adding Fee Record Submit
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
      await axios.post('/studentfee', dataToSubmit, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const feeRes = await axios.get("/studentfee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filteredRecords = feeRes.data.filter(record =>
        record.student && record.student.branch_id === userBranchId
      );
      setFeeRecords(filteredRecords || []);
      alert("Fee record saved successfully!");
      closeModal();
    } catch (error) {
      console.error("Error saving fee data:", error);
      alert("Error saving fee data. Please try again.");
    }
  };

  // Handle Adding Payment Submit
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
      const filteredRecords = feeRes.data.filter(record =>
        record.student && record.student.branch_id === userBranchId
      );
      setFeeRecords(filteredRecords || []);
      alert("Payment recorded successfully!");
      closePaymentModal();
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Error saving payment. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading fee records...</div>;
  }

  return (
    <div className="collection-container">
      <div className="collection-header">
        <h1>Fee Collection Management</h1>
      </div>

      {/* Filters UI */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-x-auto whitespace-nowrap">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by student name or admission no"
          value={filterConfig.searchText}
          onChange={(e) =>
            setFilterConfig((prev) => ({ ...prev, searchText: e.target.value }))
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-64"
        />

        {/* Status Select */}
        <select
          value={filterConfig.status}
          onChange={(e) =>
            setFilterConfig((prev) => ({ ...prev, status: e.target.value }))
          }
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-40"
        >
          <option value="">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Advance">Advance</option>
        </select>

        {/* Date From */}
        <label className="flex items-center gap-2 text-gray-600">
          <span className="text-sm font-medium">From:</span>
          <input
            type="date"
            value={filterConfig.dateFrom}
            onChange={(e) =>
              setFilterConfig((prev) => ({ ...prev, dateFrom: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </label>

        {/* Date To */}
        <label className="flex items-center gap-2 text-gray-600">
          <span className="text-sm font-medium">To:</span>
          <input
            type="date"
            value={filterConfig.dateTo}
            onChange={(e) =>
              setFilterConfig((prev) => ({ ...prev, dateTo: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </label>

        {/* Clear Filters Button */}
        <button
          onClick={() =>
            setFilterConfig({ searchText: "", status: "", dateFrom: "", dateTo: "" })
          }
          className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
        >
          Clear
        </button>
      </div>


      {/* Statistics Cards */}
      <div className="flex items-center justify-between gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-200 overflow-x-auto whitespace-nowrap">
        {/* Total Fee Records */}
        <div className="flex items-center gap-3 bg-blue-50 px-5 py-3 rounded-lg min-w-[220px]">
          <div className="text-blue-600 text-3xl">
            <i className="fas fa-receipt"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{processedFeeRecords.length}</h3>
            <p className="text-sm text-gray-600">Total Fee Records</p>
          </div>
        </div>

        {/* Fully Paid */}
        <div className="flex items-center gap-3 bg-green-50 px-5 py-3 rounded-lg min-w-[220px]">
          <div className="text-green-600 text-3xl">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {processedFeeRecords.filter(r => r.pending_amount === 0).length}
            </h3>
            <p className="text-sm text-gray-600">Fully Paid</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="flex items-center gap-3 bg-yellow-50 px-5 py-3 rounded-lg min-w-[220px]">
          <div className="text-yellow-600 text-3xl">
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {processedFeeRecords.filter(r => r.pending_amount > 0).length}
            </h3>
            <p className="text-sm text-gray-600">Pending Payments</p>
          </div>
        </div>

        {/* Advance Payments */}
        <div className="flex items-center gap-3 bg-purple-50 px-5 py-3 rounded-lg min-w-[220px]">
          <div className="text-purple-600 text-3xl">
            <i className="fas fa-plus-circle"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {processedFeeRecords.filter(r => r.pending_amount < 0).length}
            </h3>
            <p className="text-sm text-gray-600">Advance Payments</p>
          </div>
        </div>
      </div>


      {/* Table for Fee Records */}
      <div className="table-container">
        <h2>Fee Records</h2>
        <div className="table-responsive">
          <table className="fee-table">
            <thead>
              <tr>
                <th className="sortable">
                  Student Name 
                </th>
                <th className="sortable">
                  Total Fee 
                </th>
                <th className="sortable">
                  Paid Amount 
                </th>
                <th className="sortable">
                  Pending Amount
                </th>
             
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedFeeRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">No fee records found</td>
                </tr>
              ) : (
                processedFeeRecords.map(record => (
                  <tr key={record.id}>
                    <td className="student-info">
                      <div className="student-name">{record.studentName}</div>
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

      {/* Rest of your modals remain unchanged (Add Fee, Payment Modal, Payment History) */}
      {/* Copy unchanged modal code from your original code */}

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
              {/* Keep your existing modal form unchanged */}
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
              {/* Keep your existing payment form unchanged */}
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
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Mode</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPaymentHistory.map(payment => (
                          <tr key={payment.id}>
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
