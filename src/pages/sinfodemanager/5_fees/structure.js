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
    course_id: '',
    fee_type: 'Tuition',
    payment_mode: 'one-time',
    number_of_installments: '',
    coupon_id: '',
    branch_discount_percent: '',
    branch_id: ''
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [finalFee, setFinalFee] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [installmentDetails, setInstallmentDetails] = useState([]);
  const [feeStructureDetails, setFeeStructureDetails] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const intervalId = setInterval(refreshData, 5000); // Reduced to 5 seconds
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
      if (student && student.course_id) {
        const course = courses.find(c => c.id === parseInt(student.course_id));
        setSelectedCourse(course);
        if (course) {
          setFinalFee(course.discounted_price || 0);
        }
      }
    } else {
      setSelectedStudent(null);
      setSelectedCourse(null);
      setFinalFee(0);
    }
  }, [formData.student_id, students, courses]);

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
  };

  // Handle student selection from dropdown
  const handleStudentSelect = (student) => {
    setFormData(prev => ({
      ...prev,
      student_id: student.id
    }));
    setStudentSearch(`${student.full_name} (${student.admission_number})`);
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

    let newFee = parseFloat(selectedCourse?.discounted_price || 0);

    if (coupon.discount_type === "percentage") {
      newFee = newFee - (newFee * parseFloat(coupon.discount_value)) / 100;
    } else if (coupon.discount_type === "fixed") {
      newFee = newFee - parseFloat(coupon.discount_value);
    }

    if (newFee < 0) newFee = 0;
    setFinalFee(newFee);

    setFormData(prev => ({
      ...prev,
      coupon_id: selectedCoupon
    }));

    toast.success(`Coupon applied! New fee: ₹${newFee.toLocaleString()}`);
  };

  // Check if student already has a fee structure for the selected course
  const hasExistingFeeStructure = (studentId, courseId) => {
    return feeStructures.some(structure =>
      structure.student_id === parseInt(studentId) &&
      structure.course_id === parseInt(courseId)
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

  const openModal = () => {
    setFormData({
      student_id: '',
      course_id: '',
      fee_type: 'Tuition',
      payment_mode: 'one-time',
      number_of_installments: '',
      coupon_id: '',
      branch_discount_percent: '',
    }); 
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedCourse(null);
    setFinalFee(0);
    setSelectedCoupon('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentEditId(null);
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedCourse(null);
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

    if (!selectedStudent || !selectedStudent.course_id) {
      toast.error("Selected student doesn't have a course assigned");
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

    // Check if student already has a fee structure for this course
    if (hasExistingFeeStructure(formData.student_id, selectedStudent.course_id)) {
      if (!window.confirm("This student already has a fee structure for this course. Do you want to proceed anyway?")) {
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");

      const feeStructureData = {
        student_id: parseInt(formData.student_id),
        course_id: parseInt(selectedStudent.course_id),
        fee_type: formData.fee_type,
        amount: finalFee > 0 ? finalFee : parseFloat(selectedCourse?.discounted_price || 0),
        payment_mode: formData.payment_mode,
        number_of_installments: formData.payment_mode === 'installments' ? parseInt(formData.number_of_installments) : 0,
        coupon_id: formData.coupon_id ? parseInt(formData.coupon_id) : null,
        branch_id: selectedStudent.branch_id,
        branch_discount_percent: formData.branch_discount_percent ? parseFloat(formData.branch_discount_percent) : 0
      };

      const structureRes = await axios.post('/fee-structures', feeStructureData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const feeData = {
        student_id: parseInt(formData.student_id),
        course_id: parseInt(selectedStudent.course_id),
        fee_structure_id: structureRes.data.id
      };

      await axios.post('/studentfee', feeData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Fee generated successfully!');
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
            <button onClick={openModal} className="sf-add-btn">
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
          <div className="sf-stat-card">
            <div className="sf-stat-content">
              <div className="sf-stat-icon bg-blue">
                <i className="fas fa-money-bill"></i>
              </div>
              <div className="sf-stat-text">
                <p>Total Fees</p>
                <h3>₹{totalFees.toLocaleString()}</h3>
                <span className="sf-stat-subtitle">{filteredFees.length} records</span>
              </div>
            </div>
          </div>

          <div className="sf-stat-card">
            <div className="sf-stat-content">
              <div className="sf-stat-icon bg-green">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="sf-stat-text">
                <p>Paid Amount</p>
                <h3>₹{totalPaid.toLocaleString()}</h3>
                <span className="sf-stat-subtitle">
                  {totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0}% collected
                </span>
              </div>
            </div>
          </div>

          <div className="sf-stat-card">
            <div className="sf-stat-content">
              <div className="sf-stat-icon bg-red">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <div className="sf-stat-text">
                <p>Pending Amount</p>
                <h3>₹{totalPending.toLocaleString()}</h3>
                <span className="sf-stat-subtitle">
                  {totalFees > 0 ? Math.round((totalPending / totalFees) * 100) : 0}% pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Filters Section */}
        <div className="sf-filters-horizontal">
          <div className="sf-filters-header">
            <h3>Filters</h3>
            <button onClick={clearFilters} className="sf-clear-filters-btn">
              <i className="fas fa-times"></i>
              Clear All
            </button>
          </div>
          
          <div className="sf-filters-row">
            <div className="sf-filter-group">
              <label>Student Name</label>
              <input
                type="text"
                placeholder="Search student..."
                value={filters.studentName}
                onChange={(e) => handleFilterChange('studentName', e.target.value)}
                className="sf-filter-input"
              />
            </div>

            <div className="sf-filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="sf-filter-select"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div className="sf-filter-group">
              <label>Course</label>
              <select
                value={filters.course}
                onChange={(e) => handleFilterChange('course', e.target.value)}
                className="sf-filter-select"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sf-filter-group">
              <label>From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="sf-filter-input"
              />
            </div>

            <div className="sf-filter-group">
              <label>To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="sf-filter-input"
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
                  <i className="fas fa-sync fa-spin"></i>
                  Updating...
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
                  <th>Course</th>
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
                           
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sf-form-group">
                  <label>Course</label>
                  <div className="sf-course-display">
                    {selectedStudent && selectedStudent.course_id ? (
                      <div className="sf-course-info-display">
                        {getCourseDetails(selectedStudent.course_id)}
                        {selectedCourse && (
                          <div className="sf-course-price-info">
                            <p>Course Price: ₹{parseFloat(selectedCourse.discounted_price || 0).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="sf-no-course">
                        Select a student to view course details
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

                <div className="sf-form-group">
                  <label>Branch Discount %(Manual)</label>
                  <input
                    type="number"
                    name="branch_discount_percent"
                    value={formData.branch_discount_percent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Enter discount percentage"
                  />
                </div>

                <div className="sf-form-group">
                  <label>Apply Coupon</label>
                  <div className="sf-coupon-section">
                    <select
                      value={selectedCoupon}
                      onChange={(e) => setSelectedCoupon(e.target.value)}
                      className="sf-coupon-select"
                    >
                      <option value="">-- Select Coupon --</option>
                      {coupons
                        .filter(c => !selectedStudent?.course_id || c.course_id == selectedStudent.course_id)
                        .map(coupon => (
                          <option key={coupon.id} value={coupon.id}>
                            {coupon.code} ({coupon.discount_type} - {coupon.discount_value})
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
                  {finalFee > 0 && finalFee !== parseFloat(selectedCourse?.discounted_price || 0) && (
                    <div className="sf-final-fee">
                      <i className="fas fa-tag"></i>
                      Final Fee after discount: ₹{finalFee.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="sf-modal-actions">
                <button type="button" onClick={closeModal} className="sf-cancel-btn">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sf-save-btn"
                  disabled={!selectedStudent || !selectedStudent.course_id}
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
                    {viewFee.student ? (
                      <>
                        <p className="sf-info-title"><strong>Name:</strong> {viewFee.student.full_name}</p>
                        <p><strong>Admission No:</strong> {viewFee.student.admission_number}</p>
                        <p><strong>Current Course:</strong> {getCourseDetails(viewFee.student.course_id)}</p>
                      </>
                    ) : (
                      <>
                        <p className="sf-info-title"><strong>Name:</strong> {getStudentName(viewFee.student_id)}</p>
                        <p><strong>Admission No:</strong> {getStudentAdmissionNumber(viewFee.student_id)}</p>
                        <p><strong>Current Course:</strong> {getCourseDetails(viewFee.course_id)}</p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h4>Fee Information</h4>
                  <div className="sf-info-box">
                    <p><strong>Course:</strong> {getCourseDetails(viewFee.course_id)}</p>
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
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installmentDetails.map((installment, index) => (
                          <tr key={installment.id || index}>
                            <td>{installment.installment_number}</td>
                            <td>{installment.due_date ? new Date(installment.due_date).toLocaleDateString() : 'N/A'}</td>
                            <td>₹{parseFloat(installment.amount || 0).toLocaleString()}</td>
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