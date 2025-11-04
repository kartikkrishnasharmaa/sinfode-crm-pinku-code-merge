import React, { useState, useEffect } from 'react';
import axios from "../../../api/axiosConfig";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './StudentFees.css';

const StudentFees = () => {
  const [studentFees, setStudentFees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [viewFee, setViewFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    fee_type: 'Tuition',
    payment_mode: 'one-time',
    number_of_installments: '',
    coupon_id: '',
    branch_discount_percent: '',
    branch_discount_amount: '',
    branch_id: ''
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [finalFee, setFinalFee] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [installmentDetails, setInstallmentDetails] = useState([]);
  const [feeStructureDetails, setFeeStructureDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [branchDetails, setBranchDetails] = useState(null);
  const [totalCourseFee, setTotalCourseFee] = useState(0);

  // Search and Filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    studentName: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    course: ''
  });
  
  // Sort states
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  // Active filter for stat cards
  const [activeStatFilter, setActiveStatFilter] = useState('all');

  // Fetch all student fees
  const fetchStudentFees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/studentfee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort by creation date (newest first) by default
      const sortedFees = (res.data || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setStudentFees(sortedFees);
    } catch (error) {
      console.error("Error fetching student fees:", error);
      toast.error('Failed to fetch student fees');
    }
  };

  // Fetch all courses
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

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/students/show", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data || []);
      setFilteredStudents(res.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // Fetch fee structures
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

  // Fetch all coupons
  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/coupons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupons(res.data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  // Fetch branch details
  const fetchBranchDetails = async (branchId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/branches/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranchDetails(res.data);
    } catch (error) {
      console.error("Error fetching branch details:", error);
    }
  };
  
  const fetchInstallmentDetails = async (feeStructureId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/fee-structures/${feeStructureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data && res.data.length > 0 ? res.data[0] : null;
    } catch (error) {
      console.error("Error fetching installment details:", error);
      return null;
    }
  };

  // Refresh data function
  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStudentFees(),
        fetchCourses(),
        fetchStudents(),
        fetchFeeStructures(),
        fetchCoupons()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const intervalId = setInterval(refreshData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Update filtered students when search changes
  useEffect(() => {
    if (studentSearch) {
      const filtered = students.filter(student =>
        student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(studentSearch.toLowerCase())
      );
      setFilteredStudents(filtered);
      setShowStudentDropdown(true);
    } else {
      setFilteredStudents(students);
      setShowStudentDropdown(false);
    }
  }, [studentSearch, students]);

  // Update selected student when formData.student_id changes
  useEffect(() => {
    if (formData.student_id) {
      const student = students.find(s => s.id === parseInt(formData.student_id));
      setSelectedStudent(student);
      
      if (student) {
        // Fetch branch details when student is selected
        fetchBranchDetails(student.branch_id);
        
        // Calculate total course fee
        if (student.courses && student.courses.length > 0) {
          const total = student.courses.reduce((sum, course) => 
            sum + parseFloat(course.discounted_price || 0), 0
          );
          setTotalCourseFee(total);
          setFinalFee(total);
        } else {
          setTotalCourseFee(0);
          setFinalFee(0);
        }
      }
    } else {
      setSelectedStudent(null);
      setTotalCourseFee(0);
      setFinalFee(0);
      setBranchDetails(null);
    }
  }, [formData.student_id, students]);

  // Calculate final fee when discounts change
  useEffect(() => {
    if (totalCourseFee > 0) {
      let calculatedFee = totalCourseFee;
      
      // Apply coupon discount first
      if (selectedCoupon) {
        const coupon = coupons.find(c => c.id == selectedCoupon);
        if (coupon) {
          if (coupon.discount_type === "percentage") {
            calculatedFee = calculatedFee - (calculatedFee * parseFloat(coupon.discount_value)) / 100;
          } else if (coupon.discount_type === "fixed") {
            calculatedFee = calculatedFee - parseFloat(coupon.discount_value);
          }
        }
      }

      // Apply branch percentage discount
      if (formData.branch_discount_percent) {
        calculatedFee = calculatedFee - (calculatedFee * parseFloat(formData.branch_discount_percent)) / 100;
      }

      // Apply branch amount discount
      if (formData.branch_discount_amount) {
        calculatedFee = calculatedFee - parseFloat(formData.branch_discount_amount);
      }

      if (calculatedFee < 0) calculatedFee = 0;
      setFinalFee(calculatedFee);
    }
  }, [totalCourseFee, selectedCoupon, formData.branch_discount_percent, formData.branch_discount_amount, coupons]);

  // Filter and sort student fees
  const getFilteredAndSortedFees = () => {
    let filtered = studentFees;

    // Apply filters
    if (filters.studentName) {
      filtered = filtered.filter(fee => 
        getStudentName(fee.student_id).toLowerCase().includes(filters.studentName.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(fee => fee.status === filters.status);
    }

    if (filters.course) {
      filtered = filtered.filter(fee => fee.course_id == filters.course);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(fee => 
        new Date(fee.created_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(fee => 
        new Date(fee.created_at) <= dateTo
      );
    }

    // Apply stat card filter
    if (activeStatFilter === 'paid') {
      filtered = filtered.filter(fee => fee.status === 'paid');
    } else if (activeStatFilter === 'pending') {
      filtered = filtered.filter(fee => fee.status === 'partial' || fee.status === 'unpaid');
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'created_at') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (sortConfig.key.includes('amount')) {
          aValue = parseFloat(aValue || 0);
          bValue = parseFloat(bValue || 0);
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

    return filtered;
  };

  // Handle stat card clicks
  const handleStatCardClick = (type) => {
    if (activeStatFilter === type) {
      // If already active, deactivate it
      setActiveStatFilter('all');
      setFilters(prev => ({ ...prev, status: '' }));
    } else {
      // Set new active filter
      setActiveStatFilter(type);
      if (type === 'paid') {
        setFilters(prev => ({ ...prev, status: 'paid' }));
      } else if (type === 'pending') {
        setFilters(prev => ({ ...prev, status: '' })); // We'll handle pending filter separately in getFilteredAndSortedFees
      }
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      studentName: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      course: ''
    });
    setActiveStatFilter('all');
  };

  // Handle student selection from dropdown
  const handleStudentSelect = (student) => {
    setFormData(prev => ({
      ...prev,
      student_id: student.id
    }));
    setStudentSearch(`${student.full_name} .`);
    setShowStudentDropdown(false);
  };

  // Handle coupon application
  const handleApplyCoupon = () => {
    if (!selectedCoupon) {
      toast.warning('Please select a coupon first');
      return;
    }

    const coupon = coupons.find(c => c.id == selectedCoupon);
    if (!coupon) {
      toast.error('Selected coupon not found');
      return;
    }

    let newFee = totalCourseFee;

    if (coupon.discount_type === "percentage") {
      newFee = newFee - (newFee * parseFloat(coupon.discount_value)) / 100;
    } else if (coupon.discount_type === "fixed") {
      newFee = newFee - parseFloat(coupon.discount_value);
    }

    // Apply branch discounts after coupon
    if (formData.branch_discount_percent) {
      newFee = newFee - (newFee * parseFloat(formData.branch_discount_percent)) / 100;
    }

    if (formData.branch_discount_amount) {
      newFee = newFee - parseFloat(formData.branch_discount_amount);
    }

    if (newFee < 0) newFee = 0;
    setFinalFee(newFee);

    setFormData(prev => ({
      ...prev,
      coupon_id: selectedCoupon
    }));

    toast.success(`Coupon applied! New fee: ₹${newFee.toLocaleString()}`);
  };

  // Check if both discounts are applied and show warning
  useEffect(() => {
    if (formData.branch_discount_percent && formData.branch_discount_amount) {
      toast.warning('Only one discount type can be applied at a time. Percentage discount will be used.');
    }
  }, [formData.branch_discount_percent, formData.branch_discount_amount]);

  // Check if student already has a fee structure
  const hasExistingFeeStructure = (studentId) => {
    return feeStructures.some(structure =>
      structure.student_id === parseInt(studentId)
    );
  };

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.full_name : `Student ID: ${studentId}`;
  };

  // Get student admission number by ID
  const getStudentAdmissionNumber = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.admission_number : 'N/A';
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.course_name : `Course ID: ${courseId}`;
  };

  // Get course details by ID
  const getCourseDetails = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? `${course.course_name} (${course.course_code})` : `Course ID: ${courseId}`;
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'paid': return 'sf-badge-green';
      case 'partial': return 'sf-badge-orange';
      case 'unpaid': return 'sf-badge-red';
      default: return 'sf-badge-gray';
    }
  };

  // Stats calculation
  const filteredFees = getFilteredAndSortedFees();
  const totalFees = filteredFees.reduce((sum, fee) => sum + parseFloat(fee.total_fee || 0), 0);
  const totalPaid = filteredFees.reduce((sum, fee) => sum + parseFloat(fee.paid_amount || 0), 0);
  const totalPending = filteredFees.reduce((sum, fee) => sum + parseFloat(fee.pending_amount || 0), 0);

  // Calculate stats for all fees (without filters)
  const allFees = studentFees;
  const allTotalFees = allFees.reduce((sum, fee) => sum + parseFloat(fee.total_fee || 0), 0);
  const allTotalPaid = allFees.reduce((sum, fee) => sum + parseFloat(fee.paid_amount || 0), 0);
  const allTotalPending = allFees.reduce((sum, fee) => sum + parseFloat(fee.pending_amount || 0), 0);

  const openModal = () => {
    setFormData({
      student_id: '',
      fee_type: 'Tuition',
      payment_mode: 'one-time',
      number_of_installments: '',
      coupon_id: '',
      branch_discount_percent: '',
      branch_discount_amount: '',
    }); 
    setStudentSearch('');
    setSelectedStudent(null);
    setTotalCourseFee(0);
    setFinalFee(0);
    setSelectedCoupon('');
    setBranchDetails(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentEditId(null);
    setStudentSearch('');
    setSelectedStudent(null);
    setTotalCourseFee(0);
    setFinalFee(0);
    setSelectedCoupon('');
    setBranchDetails(null);
  };

  const handleView = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const feeRes = await axios.get(`/studentfee/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const feeData = feeRes.data;
      setViewFee(feeData);
      setInstallmentDetails(feeData.installments || []);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error fetching student fee details:", error);
      toast.error('Failed to fetch fee details');
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewFee(null);
    setFeeStructureDetails(null);
    setInstallmentDetails([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    if (totalCourseFee === 0) {
      toast.error("Student is not enrolled in any course or course fee is zero");
      return;
    }

    if (!formData.fee_type) {
      toast.error("Please select fee type");
      return;
    }

    if (formData.payment_mode === 'installments' && (!formData.number_of_installments || formData.number_of_installments < 2)) {
      toast.error("Please enter valid number of installments (minimum 2)");
      return;
    }

    // Check if both discounts are applied
    if (formData.branch_discount_percent && formData.branch_discount_amount) {
      toast.warning('Both discount types applied. Using percentage discount only.');
    }

    // Check if student already has a fee structure
    if (hasExistingFeeStructure(formData.student_id)) {
      if (!window.confirm("This student already has a fee structure. Do you want to proceed anyway?")) {
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");

      // Create one fee structure for all courses with total amount
      const feeStructureData = {
        student_id: parseInt(formData.student_id),
        course_id: selectedStudent.courses && selectedStudent.courses.length > 0 ? 
          parseInt(selectedStudent.courses[0].id) : null, // Use first course ID or null
        fee_type: formData.fee_type,
        amount: finalFee > 0 ? finalFee : totalCourseFee,
        payment_mode: formData.payment_mode,
        number_of_installments: formData.payment_mode === 'installments' ? parseInt(formData.number_of_installments) : 0,
        coupon_id: formData.coupon_id ? parseInt(formData.coupon_id) : null,
        branch_id: selectedStudent.branch_id,
        branch_discount_percent: formData.branch_discount_percent ? parseFloat(formData.branch_discount_percent) : 0,
        branch_discount_amount: formData.branch_discount_amount ? parseFloat(formData.branch_discount_amount) : 0,
        total_courses_amount: totalCourseFee, // Store original total for reference
        courses_count: selectedStudent.courses ? selectedStudent.courses.length : 0
      };

      const structureRes = await axios.post('/fee-structures', feeStructureData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Create one student fee record
      const feeData = {
        student_id: parseInt(formData.student_id),
        course_id: selectedStudent.courses && selectedStudent.courses.length > 0 ? 
          parseInt(selectedStudent.courses[0].id) : null, // Use first course ID or null
        fee_structure_id: structureRes.data.id,
        total_courses_amount: totalCourseFee,
        courses_count: selectedStudent.courses ? selectedStudent.courses.length : 0
      };

      await axios.post('/studentfee', feeData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Fee generated successfully for all courses!');
      closeModal();
      refreshData();
    } catch (error) {
      console.error("Error creating fee structure and student fee:", error);
      toast.error('Failed to generate fee');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <i className="fas fa-sort text-gray-400"></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up text-blue-500"></i>
      : <i className="fas fa-sort-down text-blue-500"></i>;
  };

  return (
    <div className="student-fees-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <header className="sf-header">
        <div className="sf-header-content">
          <div className="sf-header-left">
            <div className="sf-logo">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="sf-header-text">
              <h1>Student Fee Management</h1>
              <p>Manage student fees and payments</p>
            </div>
          </div>
          <div className="sf-header-right">
            <button onClick={openModal} className="bg-blue-600 border border-x-white text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <i className="fas fa-plus"></i>
              Generate Fee
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="sf-main">
        {/* Stats Cards */}
        <div className="sf-stats-grid">
          <div 
            className={`sf-stat-card ${activeStatFilter === 'all' ? 'sf-stat-card-active' : ''}`}
            onClick={() => handleStatCardClick('all')}
            style={{ cursor: 'pointer' }}
          >
            <div className="sf-stat-content">
              <div className="sf-stat-icon bg-blue">
                <i className="fas fa-money-bill"></i>
              </div>
              <div className="sf-stat-text">
                <p>Total Fees</p>
                <h3>₹{allTotalFees.toLocaleString()}</h3>
                <span className="sf-stat-subtitle">{allFees.length} records</span>
              </div>
              {activeStatFilter === 'all' && (
                <div className="sf-stat-active-indicator">
                  <i className="fas fa-filter"></i>
                </div>
              )}
            </div>
          </div>

          <div 
            className={`sf-stat-card ${activeStatFilter === 'paid' ? 'sf-stat-card-active' : ''}`}
            onClick={() => handleStatCardClick('paid')}
            style={{ cursor: 'pointer' }}
          >
            <div className="sf-stat-content">
              <div className="sf-stat-icon bg-green">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="sf-stat-text">
                <p>Paid Amount</p>
                <h3>₹{allTotalPaid.toLocaleString()}</h3>
                <span className="sf-stat-subtitle">
                  {allTotalFees > 0 ? Math.round((allTotalPaid / allTotalFees) * 100) : 0}% collected
                </span>
              </div>
              {activeStatFilter === 'paid' && (
                <div className="sf-stat-active-indicator">
                  <i className="fas fa-filter"></i>
                </div>
              )}
            </div>
          </div>

          <div 
            className={`sf-stat-card ${activeStatFilter === 'pending' ? 'sf-stat-card-active' : ''}`}
            onClick={() => handleStatCardClick('pending')}
            style={{ cursor: 'pointer' }}
          >
            <div className="sf-stat-content">
              <div className="sf-stat-icon bg-red">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <div className="sf-stat-text">
                <p>Pending Amount</p>
                <h3>₹{allTotalPending.toLocaleString()}</h3>
                <span className="sf-stat-subtitle">
                  {allTotalFees > 0 ? Math.round((allTotalPending / allTotalFees) * 100) : 0}% pending
                </span>
              </div>
              {activeStatFilter === 'pending' && (
                <div className="sf-stat-active-indicator">
                  <i className="fas fa-filter"></i>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Indicator */}
        {activeStatFilter !== 'all' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fas fa-filter text-blue-500"></i>
                <span className="text-blue-800 font-medium">
                  Showing {activeStatFilter === 'paid' ? 'Paid' : 'Pending'} Fees
                  {activeStatFilter === 'pending' && ' (Partial + Unpaid)'}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {filteredFees.length} records
                </span>
              </div>
              <button 
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <i className="fas fa-times"></i>
                Clear Filter
              </button>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Filters</h3>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1 rounded transition-colors"
            >
              <i className="fas fa-times"></i> Clear All
            </button>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Student Name */}
            <div className="flex flex-col">
              <label className="text-gray-600 mb-1 font-medium">Student Name</label>
              <input
                type="text"
                placeholder="Search student..."
                value={filters.studentName}
                onChange={(e) => handleFilterChange('studentName', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col">
              <label className="text-gray-600 mb-1 font-medium">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Course */}
            <div className="flex flex-col">
              <label className="text-gray-600 mb-1 font-medium">Course</label>
              <select
                value={filters.course}
                onChange={(e) => handleFilterChange('course', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div className="flex flex-col">
              <label className="text-gray-600 mb-1 font-medium">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col">
              <label className="text-gray-600 mb-1 font-medium">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Student Fees Table */}
        <div className="sf-table-container">
          <div className="sf-table-header">
            <h2>Student Fees ({filteredFees.length})</h2>
            <div className="sf-table-actions">
              {loading && (
                <div className="sf-loading-indicator">
                </div>
              )}
            </div>
          </div>
          <div className="sf-table-wrapper">
            <table className="sf-table">
              <thead>
                <tr>
                  <th className="sf-sortable-header">
                    <div className="sf-header-content">
                      Student
                    </div>
                  </th>
                  <th className="sf-sortable-header">
                    <div className="sf-header-content">
                      Total Fee
                    </div>
                  </th>
                  <th className="sf-sortable-header">
                    <div className="sf-header-content">
                      Paid Amount
                    </div>
                  </th>
                  <th  className="sf-sortable-header">
                    <div className="sf-header-content">
                      Pending Amount
                    </div>
                  </th>
                  <th className="sf-sortable-header">
                    <div className="sf-header-content">
                      Status
                    </div>
                  </th>
                  <th className="sf-sortable-header">
                    <div className="sf-header-content">
                      Created Date
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map((fee, key) => (
                  <tr key={fee.id}>
                    <td>
                      <div className="sf-student-info">
                        <div className="sf-student-icon">
                          {key + 1}
                        </div>
                        <div>
                          <div className="sf-student-name">{fee.student?.name || getStudentName(fee.student_id)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="sf-amount">
                      ₹{parseFloat(fee.total_fee || 0).toLocaleString()}
                    </td>
                    <td className="sf-amount">
                      ₹{parseFloat(fee.paid_amount || 0).toLocaleString()}
                    </td>
                    <td className="sf-amount">
                      ₹{parseFloat(fee.pending_amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`sf-badge ${getStatusClass(fee.status)}`}>
                        {fee.status}
                      </span>
                    </td>
                    <td>
                      <div className="sf-date">
                        {new Date(fee.created_at).toLocaleDateString()}
                        <div className="sf-time">
                          {new Date(fee.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="sf-actions">
                        <button onClick={() => handleView(fee.id)} className="sf-action-btn text-blue" title="View Details">
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFees.length === 0 && (
              <div className="sf-empty-state">
                <i className="fas fa-search"></i>
                <h3>No fees found</h3>
                <p>Try adjusting your filters or generate a new fee</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Generate Fee Modal */}
      {showModal && (
        <div className="sf-modal-backdrop">
          <div className="sf-modal" style={{ maxWidth: '900px' }}>
            <div className="sf-modal-header">
              <h3>Generate Student Fee</h3>
              <button onClick={closeModal} className="sf-modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="sf-modal-form">
              <div className="sf-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="sf-form-group">
                  <label className="sf-required">Student</label>
                  <div className="sf-search-container">
                    <input
                      type="text"
                      placeholder="Search student by name or admission number"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onFocus={() => setShowStudentDropdown(true)}
                      className="sf-search-input"
                      required
                    />
                    {showStudentDropdown && (
                      <div className="sf-search-dropdown">
                        {filteredStudents.map(student => (
                          <div
                            key={student.id}
                            className="sf-search-dropdown-item"
                            onClick={() => handleStudentSelect(student)}
                          >
                            <div className="sf-dropdown-student-name">{student.full_name}</div>
                            <div className="sf-dropdown-admission">Admission: {student.admission_number}</div>
                            <div className="sf-dropdown-courses">
                              {student.courses && student.courses.length > 0 
                                ? `${student.courses.length} course(s) enrolled`
                                : 'No courses enrolled'
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sf-form-group">
                  <label className="sf-required">Fee Type</label>
                  <select
                    name="fee_type"
                    value={formData.fee_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Tuition">Tuition</option>
                    <option value="Exam">Exam</option>
                    <option value="Library">Library</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div className="sf-form-group">
                  <label className="sf-required">Payment Mode</label>
                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="one-time">One-time</option>
                    <option value="installments">Installments</option>
                  </select>
                </div>

                {formData.payment_mode === 'installments' && (
                  <div className="sf-form-group">
                    <label className="sf-required">Number of Installments</label>
                    <input
                      type="number"
                      name="number_of_installments"
                      value={formData.number_of_installments}
                      onChange={handleInputChange}
                      min="2"
                      max="12"
                      required
                      placeholder="Enter installments (2-12)"
                    />
                  </div>
                )}

                {/* Branch Discount Information */}
                {branchDetails && (
                  <div className="sf-form-group col-span-2">
                    <label>Branch Discount Limits</label>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {branchDetails.branch.discount_range}%
                          </div>
                          <div className="text-sm text-blue-800 font-medium">Max Percentage Discount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            ₹{parseFloat(branchDetails.branch.discount_amount).toLocaleString()}
                          </div>
                          <div className="text-sm text-green-800 font-medium">Max Amount Discount</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sf-form-group">
                  <label>Branch Discount %</label>
                  <input
                    type="number"
                    name="branch_discount_percent"
                    value={formData.branch_discount_percent}
                    onChange={handleInputChange}
                    min="0"
                    max={branchDetails?.branch?.discount_range || 100}
                    step="0.01"
                    placeholder="Enter discount percentage"
                  />
                  {branchDetails && (
                    <div className="text-xs text-gray-500 mt-1">
                      Max: {branchDetails.branch.discount_range}%
                    </div>
                  )}
                </div>

                <div className="sf-form-group">
                  <label>Branch Discount Amount (₹)</label>
                  <input
                    type="number"
                    name="branch_discount_amount"
                    value={formData.branch_discount_amount}
                    onChange={handleInputChange}
                    min="0"
                    max={branchDetails?.branch?.discount_amount || 0}
                    step="0.01"
                    placeholder="Enter discount amount"
                  />
                  {branchDetails && (
                    <div className="text-xs text-gray-500 mt-1">
                      Max: ₹{parseFloat(branchDetails.branch.discount_amount).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="sf-form-group">
                  <label>Apply Coupon</label>
                  <div className="sf-coupon-section">
                    <select
                      value={selectedCoupon}
                      onChange={(e) => setSelectedCoupon(e.target.value)}
                      className="sf-coupon-select"
                      disabled={!selectedStudent}
                    >
                      <option value="">-- Select Coupon --</option>
                      {coupons.map(coupon => (
                        <option key={coupon.id} value={coupon.id}>
                          {coupon.code} ({coupon.discount_type} - {coupon.discount_value})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="sf-apply-coupon-btn"
                      disabled={!selectedStudent}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Course Information Display */}
                <div className="sf-form-group col-span-2">
                  <label>Course Information</label>
                  {selectedStudent ? (
                    selectedStudent.courses && selectedStudent.courses.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-2">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <i className="fas fa-book text-blue-500"></i>
                            Enrolled Courses - Total: ₹{totalCourseFee.toLocaleString()}
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discounted Price</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedStudent.courses.map((course, index) => (
                                <tr key={course.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{course.course_name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{course.course_code}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{course.duration || 'N/A'}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {course.original_price ? `₹${parseFloat(course.original_price).toLocaleString()}` : 'N/A'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                                    ₹{parseFloat(course.discounted_price || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                              <tr>
                                <td colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total:</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {selectedStudent.courses[0]?.original_price ? `₹${parseFloat(selectedStudent.courses.reduce((sum, course) => sum + parseFloat(course.original_price || 0), 0)).toLocaleString()}` : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-green-700">
                                  ₹{totalCourseFee.toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <i className="fas fa-exclamation-triangle text-yellow-500 text-lg"></i>
                          <div>
                            <h5 className="font-medium text-yellow-800">No Courses Enrolled</h5>
                            <p className="text-sm text-yellow-700">This student is not enrolled in any courses</p>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <i className="fas fa-user-graduate text-gray-400 text-2xl mb-2"></i>
                      <p className="text-gray-600">Please select a student first</p>
                    </div>
                  )}
                </div>

                {/* Final Fee Display */}
                {finalFee > 0 && totalCourseFee > 0 && (
                  <div className="sf-form-group col-span-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                            <i className="fas fa-tag"></i>
                            Fee Summary
                          </h4>
                          <p className="text-sm text-green-700 mt-1">
                            Original Total: ₹{totalCourseFee.toLocaleString()} | Final Fee: ₹{finalFee.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ₹{finalFee.toLocaleString()}
                          </div>
                          <div className="text-sm text-green-700">
                            After all discounts
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="sf-modal-actions">
                <button type="button" onClick={closeModal} className="sf-cancel-btn">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sf-save-btn"
                  disabled={!selectedStudent || totalCourseFee === 0}
                >
                  <i className="fas fa-save"></i>
                  Generate Single Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Fee Modal */}
      {showViewModal && viewFee && (
        <div className="sf-modal-backdrop">
          <div className="sf-modal sf-view-modal">
            <div className="sf-modal-header">
              <h3>Fee Details</h3>
              <button onClick={closeViewModal} className="sf-modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="sf-view-content">
              <div className="sf-view-grid">
                <div>
                  <h4>Student Information</h4>
                  <div className="sf-info-box">
                    {viewFee.student ? (
                      <>
                        <p className="sf-info-title"><strong>Name:</strong> {viewFee.student.full_name}</p>
                        <p><strong>Admission No:</strong> {viewFee.student.admission_number}</p>
                      </>
                    ) : (
                      <>
                        <p className="sf-info-title"><strong>Name:</strong> {getStudentName(viewFee.student_id)}</p>
                        <p><strong>Admission No:</strong> {getStudentAdmissionNumber(viewFee.student_id)}</p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h4>Fee Information</h4>
                  <div className="sf-info-box">
                    <p><strong>Total Fee:</strong> ₹{parseFloat(viewFee.total_fee || 0).toLocaleString()}</p>
                    <p><strong>Paid Amount:</strong> ₹{parseFloat(viewFee.paid_amount || 0).toLocaleString()}</p>
                    <p><strong>Pending Amount:</strong> ₹{parseFloat(viewFee.pending_amount || 0).toLocaleString()}</p>
                    <p><strong>Status:</strong>
                      <span className={`sf-badge ${getStatusClass(viewFee.status)}`}>
                        {viewFee.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Installment Details */}
              {installmentDetails.length > 0 && (
                <div className="installment-section">
                  <h3 className="installment-title">📅 Installment Schedule</h3>
                  <div className="installment-box">
                    <table className="installment-table">
                      <thead>
                        <tr>
                          <th>Installment #</th>
                          <th>Due Date</th>
                          <th>Installment Amount</th>
                          <th>Adjusted Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installmentDetails.map((installment, index) => (
                          <tr key={installment.id || index}>
                            <td>{installment.installment_number}</td>
                            <td>{installment.due_date ? new Date(installment.due_date).toLocaleDateString() : 'N/A'}</td>
                            <td>₹{parseFloat(installment.amount || 0).toLocaleString()}</td>
                            <td>₹{parseFloat(installment.adjusted_amount || 0).toLocaleString()}</td>
                            <td>
                              <span className={`sf-badge ${getStatusClass(installment.status)}`}>
                                {installment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {viewFee.payments && viewFee.payments.length > 0 && (
                <div>
                  <h4 className="installment-title">Payment History</h4>
                  <div className="sf-info-box">
                    <div className="sf-payments-list">
                      <table className="sf-payments-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Amount Paid</th>
                            <th>Payment Date</th>
                            <th>Payment Mode</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewFee.payments.map((payment, index) => (
                            <tr key={payment.id || index}>
                              <td>{index + 1}</td>
                              <td>₹{parseFloat(payment.amount_paid || 0).toLocaleString()}</td>
                              <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                              <td>{payment.payment_mode || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFees;