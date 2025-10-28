import React, { useState, useEffect, useMemo } from 'react';
import axios from "../../../api/axiosConfig";
import './StudentFees.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [branches, setBranches] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState(null);
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
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [finalFee, setFinalFee] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [installmentDetails, setInstallmentDetails] = useState([]);
  const [feeStructureDetails, setFeeStructureDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search functionality states
  const [studentSearch, setStudentSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Table search state
  const [tableSearch, setTableSearch] = useState('');
  const [filteredFees, setFilteredFees] = useState([]);

  // Create maps for quick lookups
  const studentsMap = useMemo(() => {
    const map = {};
    students.forEach(student => {
      map[student.id] = student;
    });
    return map;
  }, [students]);

  const coursesMap = useMemo(() => {
    const map = {};
    courses.forEach(course => {
      map[course.id] = course;
    });
    return map;
  }, [courses]);

  const branchesMap = useMemo(() => {
    const map = {};
    branches.forEach(branch => {
      map[branch.id] = branch;
    });
    return map;
  }, [branches]);

  // Filter and sort fees
  const filteredAndSortedFees = useMemo(() => {
    return (tableSearch ? studentFees.filter(fee => {
      const student = studentsMap[fee.student_id];
      if (!student) return false;
      return (
        student.full_name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(tableSearch.toLowerCase()) ||
        getCourseName(fee.course_id).toLowerCase().includes(tableSearch.toLowerCase())
      );
    }) : studentFees)
      .filter(fee => {
        if (!dateFilter.from && !dateFilter.to) return true;
        const createdDate = new Date(fee.created_at);
        if (dateFilter.from && createdDate < new Date(dateFilter.from)) return false;
        if (dateFilter.to && createdDate > new Date(dateFilter.to)) return false;
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField] || "";
        const valB = b[sortField] || "";
        if (sortOrder === "asc") return new Date(valA) - new Date(valB);
        return new Date(valB) - new Date(valA);
      });
  }, [studentFees, tableSearch, studentsMap, dateFilter, sortField, sortOrder]);

  // Fetch all student fees
  const fetchStudentFees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/studentfee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentFees(res.data || []);
      setFilteredFees(res.data || []);
    } catch (error) {
      console.error("Error fetching student fees:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("branches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const branchData = res.data.map((branch) => ({
        id: branch.id,
        branchName: branch.branch_name,
        branch_code: branch.branch_code || "BR-" + branch.id,
        city: branch.city,
        state: branch.state,
        contact: branch.contact_number,
        email: branch.email,
        status: branch.status,
        opening_date: branch.opening_date,
        discount_range: branch.discount_range || "",
        pin_code: branch.pin_code || "",
        address: branch.address || "",
        branch_type: branch.branch_type || "Main",
      }));
      setBranches(branchData);
    } catch (error) {
      console.error("Error fetching branches:", error);
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

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStudentFees(),
          fetchCourses(),
          fetchStudents(),
          fetchFeeStructures(),
          fetchCoupons(),
          fetchBranches()
        ]);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
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

  // Calculate total fees from all courses - FIXED
  const calculateTotalFees = () => {
    if (selectedCourses.length === 0) return 0;
    
    const baseTotal = selectedCourses.reduce((total, course) => {
      return total + parseFloat(course.discounted_price || 0);
    }, 0);
    
    return baseTotal;
  };

  // Calculate discounted total - FIXED
  const calculateDiscountedTotal = () => {
    const baseTotal = calculateTotalFees();
    
    // Apply branch discount percentage if provided
    if (formData.branch_discount_percent) {
      const discountPercent = (formData.branch_discount_percent) / 100;
      return baseTotal * (1 - discountPercent);
    }
    
    // Apply branch discount amount if provided
    if (formData.branch_discount_amount) {
      const discountAmount = (formData.branch_discount_amount);
      return Math.max(0, baseTotal - discountAmount);
    }
    
    return baseTotal;
  };

  // Update final fee when courses or discounts change
  useEffect(() => {
    setFinalFee(calculateDiscountedTotal());
  }, [selectedCourses, formData.branch_discount_percent, formData.branch_discount_amount]);

  // Handle student selection from dropdown - FIXED
  const handleStudentSelect = (student) => {
    setFormData(prev => ({
      ...prev,
      student_id: student.id,
      branch_id: student.branch_id
    }));
    setStudentSearch(`${student.full_name} (${student.admission_number})`);
    setShowStudentDropdown(false);
    setSelectedStudent(student);
    
    // Set selected courses from student's courses
    // FIX: Handle both single course (course_id) and multiple courses (courses array)
    if (student.courses && student.courses.length > 0) {
      setSelectedCourses(student.courses);
    } else if (student.course_id) {
      // Handle legacy single course structure
      const singleCourse = courses.find(c => c.id === student.course_id);
      if (singleCourse) {
        setSelectedCourses([singleCourse]);
      } else {
        setSelectedCourses([]);
      }
    } else {
      setSelectedCourses([]);
    }

    // Validate if branch discount is already entered for the selected student
    if (formData.branch_discount_percent) {
      validateBranchDiscountForStudent(formData.branch_discount_percent, student.id);
    }
  };

  const validateBranchDiscountForStudent = (discountPercent, studentId) => {
    if (!studentId || !discountPercent) return true;

    const student = studentsMap[studentId];
    if (!student || !student.branch_id) return true;

    const branch = branchesMap[student.branch_id];
    if (!branch || !branch.discount_range) return true;

    const branchDiscountRange = branch.discount_range;
    let minDiscount, maxDiscount;

    if (typeof branchDiscountRange === 'string') {
      const rangeParts = branchDiscountRange.split('-').map(Number);
      minDiscount = rangeParts[0];
      maxDiscount = rangeParts[1];
    } else if (Array.isArray(branchDiscountRange)) {
      minDiscount = Number(branchDiscountRange[0]);
      maxDiscount = Number(branchDiscountRange[1]);
    } else if (typeof branchDiscountRange === 'object' && branchDiscountRange !== null) {
      minDiscount = Number(branchDiscountRange.min || branchDiscountRange.min_discount || 0);
      maxDiscount = Number(branchDiscountRange.max || branchDiscountRange.max_discount || 0);
    } else {
      minDiscount = 0;
      maxDiscount = Number(branchDiscountRange);
    }

    if (isNaN(minDiscount) || isNaN(maxDiscount)) {
      console.warn('Invalid discount range format:', branchDiscountRange);
      return true;
    }

    const enteredDiscount = parseFloat(discountPercent);

    if (enteredDiscount < minDiscount || enteredDiscount > maxDiscount) {
      alert(`Branch discount must be between ${minDiscount}% and ${maxDiscount}% for ${student.full_name}'s branch (${branch.branchName}).`);
      return false;
    }

    return true;
  };

  const validateBranchDiscount = (discountPercent, branchId) => {
    if (!branchId || !discountPercent) return true;

    const branch = branchesMap[branchId];
    if (!branch || !branch.discount_range) return true;

    const branchDiscountRange = branch.discount_range;
    let minDiscount, maxDiscount;

    if (typeof branchDiscountRange === 'string') {
      const rangeParts = branchDiscountRange.split('-').map(Number);
      minDiscount = rangeParts[0];
      maxDiscount = rangeParts[1];
    } else if (Array.isArray(branchDiscountRange)) {
      minDiscount = Number(branchDiscountRange[0]);
      maxDiscount = Number(branchDiscountRange[1]);
    } else if (typeof branchDiscountRange === 'object' && branchDiscountRange !== null) {
      minDiscount = Number(branchDiscountRange.min || branchDiscountRange.min_discount || 0);
      maxDiscount = Number(branchDiscountRange.max || branchDiscountRange.max_discount || 0);
    } else {
      minDiscount = 0;
      maxDiscount = Number(branchDiscountRange);
    }

    if (isNaN(minDiscount) || isNaN(maxDiscount)) {
      console.warn('Invalid discount range format:', branchDiscountRange);
      return true;
    }

    const enteredDiscount = parseFloat(discountPercent);

    if (enteredDiscount < minDiscount || enteredDiscount > maxDiscount) {
      alert(`Branch discount must be between ${minDiscount}% and ${maxDiscount}% for this branch.`);
      return false;
    }

    return true;
  };

  // Handle branch discount input change with validation
  const handleBranchDiscountChange = (e) => {
    const { name, value } = e.target;

    if (value && selectedStudent && selectedStudent.branch_id) {
      const isValid = validateBranchDiscount(value, selectedStudent.branch_id);
      if (!isValid) {
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check if student already has a fee structure
  const hasExistingFeeStructure = (studentId) => {
    return feeStructures.some(structure =>
      structure.student_id === parseInt(studentId)
    );
  };

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = studentsMap[studentId];
    return student ? student.full_name : `Student ID: ${studentId}`;
  };

  // Get student admission number by ID
  const getStudentAdmissionNumber = (studentId) => {
    const student = studentsMap[studentId];
    return student ? student.admission_number : 'N/A';
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = coursesMap[courseId];
    return course ? course.course_name : `Course ID: ${courseId}`;
  };

  // Get course details by ID
  const getCourseDetails = (courseId) => {
    const course = coursesMap[courseId];
    return course ? `${course.course_name} (${course.course_code})` : `Course ID: ${courseId}`;
  };

  // Format discount range for display
  const formatDiscountRange = (discountRange) => {
    if (!discountRange) return '0-0';

    if (typeof discountRange === 'string') {
      return discountRange;
    } else if (Array.isArray(discountRange)) {
      return discountRange.join('-');
    } else if (typeof discountRange === 'object' && discountRange !== null) {
      const min = discountRange.min || discountRange.min_discount || 0;
      const max = discountRange.max || discountRange.max_discount || 0;
      return `${min}-${max}`;
    } else {
      return `0-${discountRange}`;
    }
  };

  const openModal = () => {
    setFormData({
      student_id: '',
      fee_type: 'Tuition',
      payment_mode: 'one-time',
      number_of_installments: '',
      coupon_id: '',
      branch_discount_percent: '',
      branch_discount_amount: '',
      branch_id: ''
    });
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedCourses([]);
    setFinalFee(0);
    setSelectedCoupon('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentEditId(null);
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedCourses([]);
    setFinalFee(0);
    setSelectedCoupon('');
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
    }
  };

  // Delete fee function
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/studentfee/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudentFees(prevFees => prevFees.filter(fee => fee.id !== id));
      setFilteredFees(prevFees => prevFees.filter(fee => fee.id !== id));

      toast.success("Fee record deleted successfully!");
      setShowDeleteModal(false);
      setFeeToDelete(null);
    } catch (error) {
      console.error("Error deleting student fee:", error);
      toast.error("Error deleting fee record. Please try again.");
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (fee) => {
    setFeeToDelete(fee);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setFeeToDelete(null);
  };

  // Confirm and execute deletion
  const confirmDelete = () => {
    if (feeToDelete) {
      handleDelete(feeToDelete.id);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewFee(null);
    setFeeStructureDetails(null);
    setInstallmentDetails([]);
  };

  const openPaymentModal = (id) => {
    setCurrentEditId(id);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setCurrentEditId(null);
    setPaymentAmount('');
  };

  // FIXED: Create only one fee structure per student
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedCourses.length === 0) {
      alert("Selected student doesn't have any courses assigned");
      return;
    }

    // Validate branch discount before submission
    if (formData.branch_discount_percent && selectedStudent.branch_id) {
      const isValidDiscount = validateBranchDiscount(formData.branch_discount_percent, selectedStudent.branch_id);
      if (!isValidDiscount) {
        return;
      }
    }

    // Check if student already has a fee structure
    if (hasExistingFeeStructure(formData.student_id)) {
      if (!window.confirm("This student already has a fee structure. Do you want to proceed anyway?")) {
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      
      // Create ONE fee structure for the student (not per course)
      const feeStructureData = {
        student_id: parseInt(formData.student_id),
        // For multiple courses, we can send the first course ID or leave it null if API supports
        course_id: selectedCourses.length > 0 ? parseInt(selectedCourses[0].id) : null,
        fee_type: formData.fee_type,
        amount: finalFee, // Total amount for all courses after discount
        payment_mode: formData.payment_mode,
        number_of_installments: formData.payment_mode === 'installments' ? parseInt(formData.number_of_installments) : 0,
        coupon_id: formData.coupon_id ? parseInt(formData.coupon_id) : null,
        branch_id: selectedStudent.branch_id,
        branch_discount_percent: formData.branch_discount_percent ? formData.branch_discount_percent : 0,
        branch_discount_amount: formData.branch_discount_amount ? formData.branch_discount_amount : 0,
        // Include information about all courses
        // courses: selectedCourses.map(course => ({
        //   course_id: course.id,
        //   course_name: course.course_name,
        //   original_price: course.discounted_price,
        //   batch_id: course.batch?.id
        // }))
      };

      console.log('Creating fee structure:', feeStructureData);

      // Create fee structure
      const structureRes = await axios.post('/fee-structures', feeStructureData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Fee structure created:', structureRes.data);

      // Create student fee record
      const feeData = {
        student_id: parseInt(formData.student_id),
        course_id: selectedCourses.length > 0 ? parseInt(selectedCourses[0].id) : null, // Primary course
        fee_structure_id: structureRes.data.id,
        // total_fee: finalFee
      };

      console.log('Creating student fee:', feeData);

      const feeRes = await axios.post('/studentfee', feeData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Student fee created:', feeRes.data);

      // Update state
      setTimeout(async () => {
        await fetchStudentFees();
        await fetchFeeStructures();
        setFeeStructures(prevStructures => [...prevStructures, structureRes.data]);
      }, 500);

      closeModal();
      toast.success(`Fee generated successfully for ${selectedCourses.length} course(s)!`);
      
    } catch (error) {
      console.error("Error creating fee structure and student fee:", error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        alert(`Error creating fee structure: ${error.response.data.message || 'Please try again.'}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        alert('Network error. Please check your connection and try again.');
      } else {
        console.error('Error message:', error.message);
        alert('Error creating fee structure. Please try again.');
      }
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const paymentData = {
        paid_amount: parseFloat(paymentAmount)
      };

      const res = await axios.put(`/studentfee/update/${currentEditId}`, paymentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudentFees(prevFees => prevFees.map(f => f.id === currentEditId ? res.data : f));
      setFilteredFees(prevFees => prevFees.map(f => f.id === currentEditId ? res.data : f));

      closePaymentModal();
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Error recording payment. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'branch_discount_percent') {
      handleBranchDiscountChange(e);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleApplyCoupon = () => {
    if (!selectedCoupon) return;
    setFormData(prev => ({ ...prev, coupon_id: selectedCoupon }));
    toast.success("Coupon applied!");
  };

  // Stats calculation
  const totalFees = useMemo(() =>
    studentFees.reduce((sum, fee) => sum + parseFloat(fee.total_fee || 0), 0),
    [studentFees]
  );

  const totalPaid = useMemo(() =>
    studentFees.reduce((sum, fee) => sum + parseFloat(fee.paid_amount || 0), 0),
    [studentFees]
  );

  const totalPending = useMemo(() =>
    studentFees.reduce((sum, fee) => sum + parseFloat(fee.pending_amount || 0), 0),
    [studentFees]
  );

  if (loading) {
    return (
      <div className="student-fees-container">
        <div className="sf-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-fees-container">
      <ToastContainer />

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
          <button onClick={openModal} className="bg-[#3F8CFF] hover:bg-blue-700 text-white px-4 py-2 rounded-3xl flex items-center gap-2">
            <i className="fas fa-plus"></i>
            Generate Fee
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="sf-main">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Total Fees Card */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm border border-blue-100 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-blue-700 mb-1">Total Fees</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">₹{totalFees.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                <i className="fas fa-money-bill text-white text-lg"></i>
              </div>
            </div>
          </div>

          {/* Paid Amount Card */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-sm border border-green-100 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-green-700 mb-1">Paid Amount</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">₹{totalPaid.toLocaleString()}</h3>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${totalFees > 0 ? (totalPaid / totalFees) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
                <i className="fas fa-check-circle text-white text-lg"></i>
              </div>
            </div>
          </div>

          {/* Pending Amount Card */}
          <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-sm border border-red-100 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Pending Amount</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">₹{totalPending.toLocaleString()}</h3>
                <div className="w-full bg-red-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${totalFees > 0 ? (totalPending / totalFees) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-sm">
                <i className="fas fa-exclamation-circle text-white text-lg"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white shadow-sm hover:border-blue-400 transition-all"
          >
            <option value="created_at">Sort by Created Date</option>
            <option value="total_fee">Sort by Total Fee</option>
            <option value="paid_amount">Sort by Paid Amount</option>
          </select>

          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white shadow-sm hover:border-blue-400 transition-all"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <input
            type="date"
            value={dateFilter.from}
            onChange={e => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white shadow-sm hover:border-blue-400 transition-all"
            placeholder="From"
          />

          <input
            type="date"
            value={dateFilter.to}
            onChange={e => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white shadow-sm hover:border-blue-400 transition-all"
            placeholder="To"
          />

          <button
            onClick={() => setDateFilter({ from: '', to: '' })}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          >
            Reset Dates
          </button>
        </div>

        {/* Student Fees Table */}
        <div className="sf-table-container">
          <div className="sf-table-header">
            <h2>Student Fees</h2>
            <div className="sf-table-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by student name, admission number, or course..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="sf-search-input"
              />
            </div>
          </div>
          <div className="sf-table-wrapper">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Total Fee</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedFees.map(fee => (
                  <tr key={fee.id}>
                    <td>
                      <div className="sf-student-info">
                        <div className="sf-student-icon">
                          <i className="fas fa-user"></i>
                        </div>
                        <div>
                          <div className="sf-student-name">{getStudentName(fee.student_id)}</div>
                          <div className="sf-student-details">
                            Admission No: {getStudentAdmissionNumber(fee.student_id)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="sf-course-info">
                        <div>
                          <div className="sf-course-name">{getCourseName(fee.course_id)}</div>
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
                      <span className={`sf-badge`}>
                        {fee.status}
                      </span>
                    </td>
                    <td>
                      <div className="sf-actions">
                        <button onClick={() => handleView(fee.id)} className="sf-action-btn text-blue">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          onClick={() => openDeleteModal(fee)}
                          className="sf-action-btn text-red"
                          title="Delete Fee"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAndSortedFees.length === 0 && (
                  <tr>
                    <td colSpan="7" className="sf-no-data">
                      <i className="fas fa-info-circle"></i>
                      {tableSearch ? 'No matching records found' : 'No fee records available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Generate Fee Modal */}
      {showModal && (
        <div className="sf-modal-backdrop">
          <div className="sf-modal">
            <div className="sf-modal-header">
              <h3>Generate Student Fee</h3>
              <button onClick={closeModal} className="sf-modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="sf-modal-form">
              <div className="sf-form-grid">
                <div className="sf-form-group">
                  <label>Student</label>
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
                            <div className="sf-student-dropdown-info">
                              <div className="sf-student-dropdown-name">{student.full_name}</div>
                              <div className="sf-student-dropdown-details">
                                {student.branch_id && branchesMap[student.branch_id] && (
                                  <span> Branch: {branchesMap[student.branch_id].branchName}</span>
                                )}
                                <span> • Courses: {student.courses ? student.courses.length : (student.course_id ? 1 : 0)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sf-form-group">
                  <label>Selected Courses & Total Fees</label>
                  <div className="sf-courses-display">
                    {selectedCourses.length > 0 ? (
                      <div className="sf-courses-list">
                        {selectedCourses.map((course, index) => (
                          <div key={course.id} className="sf-course-item">
                            <div className="sf-course-info">
                              <div className="sf-course-name">{course.course_name}</div>
                              <div className="sf-course-details">
                                <span>Code: {course.course_code}</span>
                                <span>Batch: {course.batch?.batch_name || 'N/A'}</span>
                                <span className="sf-course-price">
                                  ₹{parseFloat(course.discounted_price || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="sf-total-fees">
                          <div className="sf-total-label">Base Total:</div>
                          <div className="sf-total-amount">
                            ₹{calculateTotalFees().toLocaleString()}
                          </div>
                        </div>
                        {(formData.branch_discount_percent || formData.branch_discount_amount) && (
                          <div className="sf-total-fees discounted">
                            <div className="sf-total-label">Final Total (After Discount):</div>
                            <div className="sf-total-amount final">
                              ₹{finalFee}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="sf-no-courses">
                        No courses assigned to this student
                      </div>
                    )}
                  </div>
                </div>

                <div className="sf-form-group">
                  <label>Branch Intended Discount %</label>
                  <input
                    type="number"
                    name="branch_discount_percent"
                    value={formData.branch_discount_percent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    placeholder="Enter discount percentage"
                  />
                  {selectedStudent && selectedStudent.branch_id && branchesMap[selectedStudent.branch_id] && (
                    <div className="sf-branch-discount-info">
                      <small>
                        Discount Allowed range for this branch: {formatDiscountRange(branchesMap[selectedStudent.branch_id].discount_range) || '0-0'}%
                      </small>
                    </div>
                  )}
                </div>

                <div className="sf-form-group">
                  <label>Branch Intended Discount (Amount ₹)</label>
                  <input
                    type="number"
                    name="branch_discount_amount"
                    value={formData.branch_discount_amount}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Enter discount amount in ₹"
                  />
                  {selectedStudent && selectedStudent.branch_id && branchesMap[selectedStudent.branch_id] && (
                    <div className="sf-branch-discount-info">
                      <small>
                        Enter fixed discount amount in rupees
                      </small>
                    </div>
                  )}
                </div>

                <div className="sf-form-group">
                  <label>Fee Type</label>
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
                  <label>Payment Mode</label>
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
                    <label>Number of Installments</label>
                    <input
                      type="number"
                      name="number_of_installments"
                      value={formData.number_of_installments}
                      onChange={handleInputChange}
                      min="2"
                      max="12"
                      required
                    />
                  </div>
                )}

                <div className="sf-form-group">
                  <label>Apply Coupon</label>
                  <div className="sf-coupon-section">
                    <select 
                      value={selectedCoupon}
                      onChange={e => setSelectedCoupon(e.target.value)}
                      className="sf-coupon-select"
                    >
                      <option value="">-- Select Coupon --</option>
                      {coupons.map(coupon => (
                        <option key={coupon.id} value={coupon.id}>
                          {coupon.code} {coupon.discounttype} - {coupon.discountvalue}
                        </option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon} 
                      className="sf-apply-coupon-btn"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <div className="sf-modal-actions">
                <button type="button" onClick={closeModal} className="sf-cancel-btn">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sf-save-btn"
                  disabled={!selectedStudent || selectedCourses.length === 0}
                >
                  <i className="fas fa-save"></i>
                  Generate Fee
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
                    <p className="sf-info-title"><strong>Name:</strong> {getStudentName(viewFee.student_id)}</p>
                    <p><strong>Admission No:</strong> {getStudentAdmissionNumber(viewFee.student_id)}</p>
                    <p><strong>Course:</strong> {getCourseDetails(viewFee.course_id)}</p>
                  </div>
                </div>
                <div>
                  <h4>Fee Information</h4>
                  <div className="sf-info-box">
                    <p><strong>Total Fee:</strong> ₹{parseFloat(viewFee.total_fee || 0).toLocaleString()}</p>
                    <p><strong>Paid Amount:</strong> ₹{parseFloat(viewFee.paid_amount || 0).toLocaleString()}</p>
                    <p><strong>Pending Amount:</strong> ₹{parseFloat(viewFee.pending_amount || 0).toLocaleString()}</p>
                    <p><strong>Status:</strong>
                      <span className={`sf-badge`}>
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
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installmentDetails.map((installment, index) => (
                          <tr key={installment.id || index}>
                            <td>{installment.installment_number}</td>
                            <td>{installment.due_date ? new Date(installment.due_date).toLocaleDateString() : 'N/A'}</td>
                            <td>₹{parseFloat(installment.amount || 0).toLocaleString()}</td>
                            <td>
                              <span className={`sf-badge`}>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && feeToDelete && (
        <div className="sf-modal-backdrop">
          <div className="sf-modal sf-delete-modal">
            <div className="sf-modal-header">
              <h3>Want to Delete this Fee Record ?</h3>
              <button onClick={closeDeleteModal} className="sf-modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="sf-delete-content">
              <div className="sf-delete-text">
                <div className="sf-delete-details">
                  <p><strong>Student:</strong> {getStudentName(feeToDelete.student_id)}</p>
                  <p><strong>Course:</strong> {getCourseName(feeToDelete.course_id)}</p>
                  <p><strong>Total Fee:</strong> ₹{parseFloat(feeToDelete.total_fee || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="sf-modal-actions">
              <button
                onClick={closeDeleteModal}
                className="sf-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="sf-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="sf-modal-backdrop">
          <div className="sf-modal">
            <div className="sf-modal-header">
              <h3>Record Payment</h3>
              <button onClick={closePaymentModal} className="sf-modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="sf-modal-form">
              <div className="sf-form-group">
                <label>Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="sf-modal-actions">
                <button type="button" onClick={closePaymentModal} className="sf-cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="sf-save-btn">
                  <i className="fas fa-money-bill"></i>
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFees;