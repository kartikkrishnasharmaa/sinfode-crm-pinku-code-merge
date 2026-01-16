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

  // New states for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // New state for fee status filter
  const [feeStatusFilter, setFeeStatusFilter] = useState('all'); // 'all', 'paid', 'pending'

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
    // Get course name by ID
  const getCourseName = (courseId) => {
    const course = coursesMap[courseId];
    return course ? course.course_name : `Course ID: ${courseId}`;
  };

  // Filter and sort fees with status filter
  const filteredAndSortedFees = useMemo(() => {
    let filtered = studentFees;

    // Apply fee status filter
    if (feeStatusFilter === 'paid') {
      filtered = filtered.filter(fee => parseFloat(fee.pending_amount || 0) === 0);
    } else if (feeStatusFilter === 'pending') {
      filtered = filtered.filter(fee => parseFloat(fee.pending_amount || 0) > 0);
    }

    // Apply search filter
    if (tableSearch) {
      filtered = filtered.filter(fee => {
        const student = studentsMap[fee.student_id];
        if (!student) return false;
        return (
          student.full_name.toLowerCase().includes(tableSearch.toLowerCase()) ||
          student.admission_number.toLowerCase().includes(tableSearch.toLowerCase()) ||
          getCourseName(fee.course_id).toLowerCase().includes(tableSearch.toLowerCase())
        );
      });
    }

    // Apply date filter
    filtered = filtered.filter(fee => {
      if (!dateFilter.from && !dateFilter.to) return true;
      const createdDate = new Date(fee.created_at);
      if (dateFilter.from && createdDate < new Date(dateFilter.from)) return false;
      if (dateFilter.to && createdDate > new Date(dateFilter.to)) return false;
      return true;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      const valA = a[sortField] || "";
      const valB = b[sortField] || "";
      if (sortOrder === "asc") return new Date(valA) - new Date(valB);
      return new Date(valB) - new Date(valA);
    });
  }, [studentFees, feeStatusFilter, tableSearch, studentsMap, dateFilter, sortField, sortOrder]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFees = filteredAndSortedFees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedFees.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

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
        discount_amount: branch.discount_amount || 0,
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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, dateFilter, feeStatusFilter]);

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

  const getStudentCourses = (studentId) => {
    const student = studentsMap[studentId];

    if (!student) return [];

    // Multiple courses case
    if (student.courses && student.courses.length > 0) {
      return student.courses;
    }

    // Single course old structure
    if (student.course_id) {
      const course = coursesMap[student.course_id];
      return course ? [course] : [];
    }

    return [];
  };

  // NEW: Check if both discount fields are filled
  const checkBothDiscountsFilled = (percent, amount) => {
    return percent && amount && percent > 0 && amount > 0;
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
      toast.warning(`Branch discount must be between ${minDiscount}% and ${maxDiscount}% for ${student.full_name}'s branch (${branch.branchName}).`);
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
      toast.warning(`Branch discount must be between ${minDiscount}% and ${maxDiscount}% for this branch.`);
      return false;
    }

    return true;
  };

  // Handle branch discount input change with validation - UPDATED
  const handleBranchDiscountChange = (e) => {
    const { name, value } = e.target;

    // Check if both discount fields are being filled
    if (name === 'branch_discount_percent' && value && formData.branch_discount_amount) {
      toast.warning('You can only apply either percentage discount OR amount discount, not both. The amount discount will be cleared.');
      setFormData(prev => ({
        ...prev,
        branch_discount_amount: ''
      }));
    } else if (name === 'branch_discount_amount' && value && formData.branch_discount_percent) {
      toast.warning('You can only apply either percentage discount OR amount discount, not both. The percentage discount will be cleared.');
      setFormData(prev => ({
        ...prev,
        branch_discount_percent: ''
      }));
    }

    if (value && selectedStudent && selectedStudent.branch_id) {
      // For percentage discount, validate the range
      if (name === 'branch_discount_percent') {
        const isValid = validateBranchDiscount(value, selectedStudent.branch_id);
        if (!isValid) {
          setFormData(prev => ({
            ...prev,
            [name]: ''
          }));
          return;
        }
      }
      // For amount discount, validate against branch's discount_amount
      else if (name === 'branch_discount_amount') {
        const branch = branchesMap[selectedStudent.branch_id];
        if (branch && branch.discount_amount && parseFloat(value) > parseFloat(branch.discount_amount)) {
          toast.warning(`Branch discount amount cannot exceed ₹${branch.discount_amount} for this branch.`);
          setFormData(prev => ({
            ...prev,
            [name]: ''
          }));
          return;
        }
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

  // Get fee status badge class
  const getFeeStatusClass = (fee) => {
    const pendingAmount = parseFloat(fee.pending_amount || 0);
    if (pendingAmount === 0) {
      return 'sf-badge sf-badge-paid';
    } else {
      return 'sf-badge sf-badge-pending';
    }
  };

  // Get fee status text
  const getFeeStatusText = (fee) => {
    const pendingAmount = parseFloat(fee.pending_amount || 0);
    if (pendingAmount === 0) {
      return 'Paid';
    } else {
      return 'Pending';
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

      // Get student data to fetch all courses
      const student = studentsMap[feeData.student_id];
      if (student) {
        // Handle both single course (course_id) and multiple courses (courses array)
        if (student.courses && student.courses.length > 0) {
          // Student has multiple courses
          setSelectedCourses(student.courses);
        } else if (student.course_id) {
          // Student has single course (legacy structure)
          const singleCourse = courses.find(c => c.id === student.course_id);
          if (singleCourse) {
            setSelectedCourses([singleCourse]);
          } else {
            setSelectedCourses([]);
          }
        } else {
          setSelectedCourses([]);
        }
      }

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
    setSelectedCourses([]); // Reset selected courses when closing modal
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

    // NEW: Check if both discount fields are filled
    if (checkBothDiscountsFilled(formData.branch_discount_percent, formData.branch_discount_amount)) {
      toast.warning('Please use either percentage discount OR amount discount, not both.');
      return;
    }

    if (selectedCourses.length === 0) {
      toast.warning("Selected student doesn't have any courses assigned");
      return;
    }

    // Validate branch discount before submission
    if (formData.branch_discount_percent && selectedStudent.branch_id) {
      const isValidDiscount = validateBranchDiscount(formData.branch_discount_percent, selectedStudent.branch_id);
      if (!isValidDiscount) {
        return;
      }
    }

    // Validate branch discount amount before submission
    if (formData.branch_discount_amount && selectedStudent.branch_id) {
      const branch = branchesMap[selectedStudent.branch_id];
      if (branch && branch.discount_amount && parseFloat(formData.branch_discount_amount) > parseFloat(branch.discount_amount)) {
        toast.warning(`Branch discount amount cannot exceed ₹${branch.discount_amount} for this branch.`);
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
        toast.warning(`Error creating fee structure: ${error.response.data.message || 'Please try again.'}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        toast.warning('Network error. Please check your connection and try again.');
      } else {
        console.error('Error message:', error.message);
        toast.warning('Error creating fee structure. Please try again.');
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
      toast.warning("Error recording payment. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'branch_discount_percent' || name === 'branch_discount_amount') {
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

  // NEW: Handle stats card clicks
  const handleTotalFeesClick = () => {
    setFeeStatusFilter('all');
    setTableSearch('');
    setDateFilter({ from: '', to: '' });
  };

  const handlePaidFeesClick = () => {
    setFeeStatusFilter('paid');
  };

  const handlePendingFeesClick = () => {
    setFeeStatusFilter('pending');
  };

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
      <main className="mt-6 mb-4">
        {/* Stats Cards - Made Clickable */}
        <div className="grid grid-cols-1 mt-3 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Total Fees Card */}
          <div
            className={`bg-gradient-to-br from-blue-90 to-white rounded-2xl shadow-sm border border-blue-100 p-6 cursor-pointer transition-all hover:shadow-md ${feeStatusFilter === 'all' ? 'ring-2 ring-blue-400' : ''
              }`}
            onClick={handleTotalFeesClick}
            title="Click to view all fees"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-blue-700 mb-1">Total Fees</p>
                <h3 className="text-xl font-bold text-gray-900 mb-2">₹{totalFees.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Paid Amount Card */}
          <div
            className={`bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-sm border border-green-100 p-6 cursor-pointer transition-all hover:shadow-md ${feeStatusFilter === 'paid' ? 'ring-2 ring-green-400' : ''
              }`}
            onClick={handlePaidFeesClick}
            title="Click to view fully paid fees"
          >
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
            </div>
          </div>

          {/* Pending Amount Card */}
          <div
            className={`bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-sm border border-red-100 p-6 cursor-pointer transition-all hover:shadow-md ${feeStatusFilter === 'pending' ? 'ring-2 ring-red-400' : ''
              }`}
            onClick={handlePendingFeesClick}
            title="Click to view pending fees"
          >
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
            </div>
          </div>
        </div>

        {/* Active Filter Indicator */}
        {feeStatusFilter !== 'all' && (
          <div className="bg-blue-50 mt-3 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-filter text-blue-600"></i>
                <span className="text-blue-700 font-medium">
                  Showing {feeStatusFilter === 'paid' ? 'fully paid' : 'pending'} fees
                </span>
              </div>
              <button
                onClick={() => setFeeStatusFilter('all')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Show All
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap mt-3 items-center gap-3 mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
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
            <table className="sf-table w-full">
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
                {currentFees.map((fee) => (
                  <tr key={fee.id} className="align-top">

                    {/* --- STUDENT COLUMN --- */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                          <i className="fas fa-user text-blue-600"></i>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {getStudentName(fee.student_id)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* --- COURSE COLUMN (UPDATED & FINAL) --- */}
                    <td className="align-top">
                      {(() => {
                        const courses = getStudentCourses(fee.student_id);

                        // 🔵 If only ONE course → Blue Badge
                        if (courses.length === 1) {
                          const c = courses[0];
                          return (
                            <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-blue-700 font-semibold text-sm inline-block">
                              {c.course_name}
                            </span>
                          );
                        }

                        // 🟢 If MULTIPLE courses → compact stacked list (no scroll)
                        return (
                          <div className="border border-gray-200 rounded-md px-3 py-1 bg-blue-50 text-blue-700">
                            {courses.map((course) => (
                              <div
                                key={course.id}
                                className="flex justify-between items-center text-[11px] py-[2px]"
                              >
                                <span className="font-medium text-gray-700 truncate">
                                  {course.course_name}
                                </span>

                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </td>

                    {/* --- TOTAL FEE --- */}
                    <td className="font-semibold text-gray-800">
                      ₹{parseFloat(fee.total_fee || 0).toLocaleString()}
                    </td>

                    {/* --- PAID --- */}
                    <td className="text-green-600 font-semibold">
                      ₹{parseFloat(fee.paid_amount || 0).toLocaleString()}
                    </td>

                    {/* --- PENDING --- */}
                    <td className="text-red-600 font-semibold">
                      ₹{parseFloat(fee.pending_amount || 0).toLocaleString()}
                    </td>

                    {/* --- STATUS BADGE --- */}
                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-white text-sm font-medium ${fee.status === "paid"
                            ? "bg-green-500"
                            : fee.status === "unpaid"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                      >
                        {fee.status
                          ? fee.status.charAt(0).toUpperCase() + fee.status.slice(1)
                          : "N/A"}
                      </span>
                    </td>

                    {/* --- ACTIONS --- */}
                    <td>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleView(fee.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <i className="fas fa-eye"></i>
                        </button>

                        <button
                          onClick={() => openDeleteModal(fee)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Fee"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* --- NO DATA --- */}
                {currentFees.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-600">
                      <i className="fas fa-info-circle mr-2"></i>
                      {tableSearch || feeStatusFilter !== "all"
                        ? "No matching records found"
                        : "No fee records available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          </div>

          {/* Pagination */}
          {filteredAndSortedFees.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(indexOfLastItem, filteredAndSortedFees.length)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{filteredAndSortedFees.length}</span> entries
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`
        flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200
        ${currentPage === 1
                      ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900"
                    }
      `}
                >
                  <i className="fas fa-chevron-left text-sm"></i>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`
            flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 font-medium
            ${currentPage === page
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                        }
          `}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`
        flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200
        ${currentPage === totalPages
                      ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900"
                    }
      `}
                >
                  <i className="fas fa-chevron-right text-sm"></i>
                </button>
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="
        px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        transition-all duration-200 hover:border-gray-400
      "
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
          )}
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
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Table Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-800">Selected Courses & Fees</h3>
                        </div>

                        {/* Courses Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Course Details
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Price
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedCourses.map((course, index) => (
                                <tr
                                  key={course.id}
                                  className="hover:bg-gray-50 transition-colors duration-150"
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-start space-x-3">
                                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                        <i className="fas fa-book text-white text-sm"></i>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                                          {course.course_name}
                                        </h4>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                          {course.course_code && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              Code: {course.course_code}
                                            </span>
                                          )}
                                          {course.batch?.batch_name && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              Batch: {course.batch.batch_name}
                                            </span>
                                          )}

                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="text-lg font-bold text-green-600">
                                        ₹{parseFloat(course.discounted_price || 0).toLocaleString()}
                                      </span>
                                      {course.original_price && course.original_price !== course.discounted_price && (
                                        <span className="text-sm text-gray-500 line-through mt-1">
                                          ₹{parseFloat(course.original_price).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>

                            {/* Totals Section */}
                            <tfoot className="bg-gray-50">
                              {/* Base Total */}
                              <tr className="border-t border-gray-200">
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-semibold text-gray-700">Base Total:</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-lg font-bold text-gray-900">
                                    ₹{calculateTotalFees().toLocaleString()}
                                  </span>
                                </td>
                              </tr>

                              {/* Discount Display */}
                              {(formData.branch_discount_percent || formData.branch_discount_amount) && (
                                <>
                                  {/* Discount Row */}
                                  <tr className="border-t border-gray-200 bg-yellow-50">
                                    <td className="px-6 py-3 text-right">
                                      <div className="flex items-center justify-end space-x-2">
                                        <i className="fas fa-tag text-yellow-600 text-sm"></i>
                                        <span className="text-sm font-semibold text-yellow-800">
                                          {formData.branch_discount_percent ?
                                            `Discount (${formData.branch_discount_percent}%)` :
                                            'Discount Amount'
                                          }:
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                      <span className="text-lg font-bold text-yellow-700">
                                        {formData.branch_discount_percent ?
                                          `-${formData.branch_discount_percent}%` :
                                          `-₹${parseFloat(formData.branch_discount_amount).toLocaleString()}`
                                        }
                                      </span>
                                    </td>
                                  </tr>

                                  {/* Final Total */}
                                  <tr className="border-t border-gray-300 bg-green-50">
                                    <td className="px-6 py-4 text-right">
                                      <span className="text-sm font-semibold text-green-800">Final Total:</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <span className="text-xl font-bold text-green-700">
                                        ₹{finalFee.toLocaleString()}
                                      </span>
                                    </td>
                                  </tr>

                                  {/* Savings Info */}
                                  <tr className="bg-green-25">
                                    <td colSpan="2" className="px-6 py-2 text-center">
                                      <div className="flex items-center justify-center space-x-2 text-sm text-green-700">
                                        <i className="fas fa-piggy-bank"></i>
                                        <span>
                                          You save ₹{(calculateTotalFees() - finalFee).toLocaleString()}
                                          ({((calculateTotalFees() - finalFee) / calculateTotalFees() * 100).toFixed(1)}%)
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                </>
                              )}
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <i className="fas fa-book-open text-4xl text-gray-400 mb-4"></i>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          The selected student doesn't have any courses assigned. Please assign courses to the student first.
                        </p>
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
                        Maximum discount amount: ₹{branchesMap[selectedStudent.branch_id].discount_amount || 0}
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
                    <p className="sf-info-title">
                      <strong>Name:</strong> {getStudentName(viewFee.student_id)}
                    </p>
                    <p><strong>Admission No:</strong> {getStudentAdmissionNumber(viewFee.student_id)}</p>

                    {/* Single Course Display (for backward compatibility) */}
                    {selectedCourses.length === 1 && (
                      <p><strong>Course:</strong> {getCourseDetails(selectedCourses[0].id)}</p>
                    )}

                    {/* Multiple Courses Display */}
                    {selectedCourses.length > 1 && (
                      <div className="mt-6">
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">#</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Course Name</th>
                                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 border-b">Price (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedCourses.map((course, index) => (
                                <tr key={course.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{index + 1}</td>
                                  <td className="px-4 py-2 text-sm text-gray-800 border-b">{course.course_name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-800 text-right border-b">
                                    ₹{parseFloat(course.discounted_price || course.price || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-100">
                              <tr>
                                <td colSpan="2" className="px-4 py-3 text-right font-semibold text-gray-800 border-t">
                                  Total Courses Fee:
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900 border-t">
                                  ₹{selectedCourses.reduce(
                                    (total, course) => total + parseFloat(course.discounted_price || course.price || 0),
                                    0
                                  ).toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                    )}
                  </div>
                </div>
                <div>
                  <h4>Fee Information</h4>
                  <div className="sf-info-box">
                    <p><strong>Total Fee:</strong> ₹{parseFloat(viewFee.total_fee || 0).toLocaleString()}</p>
                    <p><strong>Paid Amount:</strong> ₹{parseFloat(viewFee.paid_amount || 0).toLocaleString()}</p>
                    <p><strong>Pending Amount:</strong> ₹{parseFloat(viewFee.pending_amount || 0).toLocaleString()}</p>
                    <p className="text-sm">
                      <strong className="mr-2">Overall Status:</strong>
                      <span
                        className={`px-3 py-1 rounded-full text-white text-sm font-medium ${viewFee.status === 'paid'
                          ? 'bg-green-500'
                          : viewFee.status === 'pending'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                          }`}
                      >
                        {viewFee.status.charAt(0).toUpperCase() + viewFee.status.slice(1)}
                      </span>
                    </p>


                    {/* Display discount information if available */}
                    {feeStructureDetails && (
                      <>
                        {feeStructureDetails.branch_discount_percent > 0 && (
                          <p><strong>Branch Discount:</strong> {feeStructureDetails.branch_discount_percent}%</p>
                        )}
                        {feeStructureDetails.branch_discount_amount > 0 && (
                          <p><strong>Branch Discount Amount:</strong> ₹{feeStructureDetails.branch_discount_amount}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Rest of your existing view modal code remains same */}
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
                              <span
                                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${installment.status === 'paid'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                                  }`}
                              >
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
              <p className='text-xl mb-6'><strong>Pending Fees Amount:</strong> ₹{parseFloat(viewFee.pending_amount || 0).toLocaleString()}</p>

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