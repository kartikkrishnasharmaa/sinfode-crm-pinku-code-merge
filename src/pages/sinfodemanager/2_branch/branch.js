import ManagerLayout from "../../../layouts/Sinfodemanager";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { FaEdit, FaToggleOn, FaToggleOff, FaTimes, FaUser, FaUsers, FaPercent, FaMoneyBillWave } from "react-icons/fa";
import { HiDotsVertical, HiLocationMarker, HiPhone, HiMail, HiCalendar, HiOfficeBuilding } from "react-icons/hi";
// Import Toastify
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isFeesModalOpen, setIsFeesModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [expandedBranchId, setExpandedBranchId] = useState(null);
  const [discountData, setDiscountData] = useState({
    type: "percentage",
    requested_range: "",
    requested_amount: ""
  });
  const [feesData, setFeesData] = useState({
    admission_fee: "",
    monthly_fee: "",
    annual_fee: "",
    other_fees: ""
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        openMenuId !== null &&
        !event.target.closest(".menu-container") &&
        !event.target.closest(".menu-toggle")
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleEditClick = (branch) => {
    setEditingBranchId(branch.id);
    setFormData({
      branch_name: branch.branch_name,
      address: branch.address || "",
      city: branch.city,
      state: branch.state,
      pin_code: branch.pin_code || "",
      contact_number: branch.contact_number,
      email: branch.email,
      opening_date: branch.opening_date || "",
      branch_type: branch.branch_type || "Main",
      status: branch.status,
      discount_range: branch.discount_range || "",
      discount_amount: branch.discount_amount || "",
      manager_name: branch.managers?.[0]?.name || "",
      manager_email: branch.managers?.[0]?.email || "",
      manager_password: "",
    });
    setIsModalOpen(true);
  };

  const handleDiscountClick = (branch) => {
    setEditingBranchId(branch.id);
    // Determine current type based on what's set in the branch
    let currentType = "percentage";
    let currentRange = branch.discount_range || "";
    let currentAmount = branch.discount_amount || "";
    // If amount is set and range is not, default to amount type
    if (branch.discount_amount && !branch.discount_range) {
      currentType = "amount";
    }
    setDiscountData({
      type: currentType,
      requested_range: currentRange,
      requested_amount: currentAmount
    });
    setIsDiscountModalOpen(true);
  };

  const handleFeesClick = (branch) => {
    setEditingBranchId(branch.id);
    setFeesData({
      admission_fee: branch.admission_fee || "",
      monthly_fee: branch.monthly_fee || "",
      annual_fee: branch.annual_fee || "",
      other_fees: branch.other_fees || ""
    });
    setIsFeesModalOpen(true);
  };

  const [formData, setFormData] = useState({
    branch_name: "",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    contact_number: "",
    email: "",
    opening_date: "",
    branch_type: "Main",
    status: "Active",
    discount_range: "",
    discount_amount: "",
    manager_name: "",
    manager_email: "",
    manager_password: "",
  });

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      let res;
      if (user.role === "admin") {
        res = await axios.get("branches", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (user.role === "branch_manager") {
        res = await axios.get(`branches/${user.branch_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      // Handle the different response structure
      let branchData = [];
      if (res.data.branch) {
        // Single branch response (for branch manager)
        branchData = [res.data.branch];
      } else if (Array.isArray(res.data)) {
        // Array of branches (for admin)
        branchData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        // Paginated response with data array
        branchData = res.data.data;
      } else {
        branchData = [res.data];
      }
      setBranches(branchData);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches");
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await axios.patch(
        `branches/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBranches(
        branches.map((branch) =>
          branch.id === id ? { ...branch, status: newStatus } : branch
        )
      );
      toast.success(`Branch status changed to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const toggleBranchExpand = (id) => {
    setExpandedBranchId(expandedBranchId === id ? null : id);
  };

  const filteredBranches = branches.filter(
    (branch) =>
      (branch.branch_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (branch.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (branch.branch_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      setDiscountData({
        ...discountData,
        type: value,
        requested_range: "",
        requested_amount: ""
      });
    } else if (name === "requested_range") {
      // Only allow numbers and limit to 100 for percentage
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue === "" || (parseInt(numericValue) >= 0 && parseInt(numericValue) <= 100)) {
        setDiscountData({ ...discountData, [name]: numericValue });
      }
    } else if (name === "requested_amount") {
      // Only allow numbers for amount
      const numericValue = value.replace(/[^0-9]/g, '');
      setDiscountData({ ...discountData, [name]: numericValue });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (editingBranchId) {
        await axios.put(`branches/${editingBranchId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Branch updated successfully!");
      } else {
        await axios.post("branches", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Branch created successfully!");
      }
      fetchBranches();
      setIsModalOpen(false);
      setEditingBranchId(null);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(
        editingBranchId ? "Error updating branch" : "Error creating branch"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateDiscount = async (e) => {
    e.preventDefault();
    setDiscountLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Prepare request data based on type
      const requestData = {
        type: discountData.type
      };
      if (discountData.type === "percentage") {
        if (!discountData.requested_range || discountData.requested_range === "") {
          toast.error("Please enter discount percentage");
          setDiscountLoading(false);
          return;
        }
        requestData.requested_range = discountData.requested_range;
      } else {
        if (!discountData.requested_amount || discountData.requested_amount === "") {
          toast.error("Please enter discount amount");
          setDiscountLoading(false);
          return;
        }
        requestData.requested_amount = discountData.requested_amount;
      }
      // Use the correct endpoint and request body
      const response = await axios.post(
        `branches/${editingBranchId}/discount-requests`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Show success message from API response
      toast.success("Discount increase request sent to admin");
      setIsDiscountModalOpen(false);
      setEditingBranchId(null);
      setDiscountData({
        type: "percentage",
        requested_range: "",
        requested_amount: ""
      });
      fetchBranches();
    } catch (error) {
      console.error("Error requesting discount:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        toast.error(`Failed to request discount: ${error.response.data.message || 'Unknown error'}`);
      } else {
        toast.error("Failed to request discount");
      }
    } finally {
      setDiscountLoading(false);
    }
  };

  const updateFees = async (e) => {
    e.preventDefault();
    setFeesLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `branches/${editingBranchId}/fees`,
        feesData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Fees updated successfully!");
      setIsFeesModalOpen(false);
      setEditingBranchId(null);
      setFeesData({
        admission_fee: "",
        monthly_fee: "",
        annual_fee: "",
        other_fees: ""
      });
      fetchBranches();
    } catch (error) {
      console.error("Error updating fees:", error);
      toast.error("Failed to update fees");
    } finally {
      setFeesLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      branch_name: "",
      address: "",
      city: "",
      state: "",
      pin_code: "",
      contact_number: "",
      email: "",
      opening_date: "",
      branch_type: "Main",
      status: "Active",
      discount_range: "",
      discount_amount: "",
      manager_name: "",
      manager_email: "",
      manager_password: "",
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Display discount information based on what's available
  const renderDiscountInfo = (branch) => {
    if (branch.discount_range && branch.discount_amount) {
      return (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Discount: {branch.discount_range}%
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Amount: {formatCurrency(branch.discount_amount)}
          </span>
        </div>
      );
    } else if (branch.discount_range) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Discount: {branch.discount_range}%
        </span>
      );
    } else if (branch.discount_amount) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Discount: {formatCurrency(branch.discount_amount)}
        </span>
      );
    }
    return null;
  };
  return (
    <ManagerLayout>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            My Branch
          </h1>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 gap-5">
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch) => (
              <div key={branch.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                {/* Branch Summary */}
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <HiOfficeBuilding className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{branch.branch_name}</h3>
                      <div className="flex items-center mt-1 text-gray-600">
                        <HiLocationMarker className="h-4 w-4 mr-1" />
                        <span>{branch.city}, {branch.state}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {branch.branch_code}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${branch.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}>
                          {branch.status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {branch.branch_type}
                        </span>
                        {renderDiscountInfo(branch)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex items-center space-x-2 self-start">
                    <button
                      onClick={() => handleDiscountClick(branch)}
                      className="bg-[#3F8CFF] hover:bg-blue-700 text-white px-4 py-2 rounded-3xl flex items-center gap-2"
                    >
                      <FaPercent className="mr-1" />Request Discount Limit
                    </button>
                    <button
                      onClick={() => toggleBranchExpand(branch.id)}
                      className="bg-[#3F8CFF] hover:bg-blue-700 text-white px-4 py-2 rounded-3xl flex items-center gap-2"
                    >
                      {expandedBranchId === branch.id ? "Show Less" : "View Details"}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedBranchId === branch.id && (
                  <div className="border-t border-gray-200 px-5 py-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* COLUMN 1 */}
                      <div className="p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 animate-fadeIn">
                        <div className="space-y-5">

                          {/* Address */}
                          <div className="flex items-start group hover:translate-x-1 transition-transform duration-300">
                            <HiLocationMarker className="h-6 w-6 text-blue-500 mr-3 mt-1 transition-all group-hover:scale-110" />
                            <div>
                              <p className="text-base font-medium text-gray-700">Address</p>
                              <p className="text-base text-gray-600 mt-1">
                                {branch.address || "N/A"} {branch.pin_code ? `- ${branch.pin_code}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="flex items-start group hover:translate-x-1 transition-transform duration-300">
                            <HiPhone className="h-6 w-6 text-green-500 mr-3 transition-all group-hover:scale-110" />
                            <div>
                              <p className="text-base font-medium text-gray-700">Contact</p>
                              <p className="text-base text-gray-600 mt-1">{branch.contact_number || "N/A"}</p>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="flex items-start group hover:translate-x-1 transition-transform duration-300">
                            <HiMail className="h-6 w-6 text-red-500 mr-3 transition-all group-hover:scale-110" />
                            <div>
                              <p className="text-base font-medium text-gray-700">Email</p>
                              <p className="text-base text-gray-600 mt-1">{branch.email || "N/A"}</p>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* COLUMN 2 */}
                      <div className="p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 animate-fadeIn delay-150">
                        <div className="space-y-5">

                          {/* Opening Date */}
                          <div className="flex items-start group hover:translate-x-1 transition-transform duration-300">
                            <HiCalendar className="h-6 w-6 text-purple-500 mr-3 transition-all group-hover:scale-110" />
                            <div>
                              <p className="text-base font-medium text-gray-700">Opening Date</p>
                              <p className="text-base text-gray-600 mt-1">{formatDate(branch.opening_date)}</p>
                            </div>
                          </div>

                          {/* Discount */}
                          {(branch.discount_range || branch.discount_amount) && (
                            <div className="flex items-start group hover:translate-x-1 transition-transform duration-300">
                              <FaPercent className="h-6 w-6 text-orange-500 mr-3 transition-all group-hover:scale-110" />
                              <div>
                                <p className="text-base font-medium text-gray-700">
                                  Maximum Discount of this Branch
                                </p>

                                {branch.discount_range && (
                                  <p className="text-base text-gray-600 mt-1">
                                    Percentage: {branch.discount_range}%
                                  </p>
                                )}

                                {branch.discount_amount && (
                                  <p className="text-base text-gray-600 mt-1">
                                    Amount: {formatCurrency(branch.discount_amount)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                    </div>

                    {/* Created & Updated */}
                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(branch.created_at)} | Last Updated: {formatDate(branch.updated_at)}
                      </p>
                    </div>
                  </div>

                )}
              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <HiOfficeBuilding className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No branches found</h3>
              <p className="mt-1 text-gray-500">
                {search ? "Try adjusting your search query" : "Get started by creating your first branch"}
              </p>
            </div>
          )}
        </div>


        {/* Discount Modal */}
        {isDiscountModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Request Maximum Discount
                </h2>
                <button
                  onClick={() => {
                    setIsDiscountModalOpen(false);
                    setEditingBranchId(null);
                    setDiscountData({
                      type: "percentage",
                      requested_range: "",
                      requested_amount: ""
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={updateDiscount} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="percentage"
                        checked={discountData.type === "percentage"}
                        onChange={handleDiscountChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Percentage (%)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="amount"
                        checked={discountData.type === "amount"}
                        onChange={handleDiscountChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Amount (₹)</span>
                    </label>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {discountData.type === "percentage" ? "Discount Percentage" : "Discount Amount"}
                  </label>
                  <div className="relative">
                    <input
                      name={discountData.type === "percentage" ? "requested_range" : "requested_amount"}
                      type="text"
                      value={discountData.type === "percentage" ? discountData.requested_range : discountData.requested_amount}
                      onChange={handleDiscountChange}
                      className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={discountData.type === "percentage" ? "Enter percentage (0-100)" : "Enter amount in rupees"}
                      maxLength={discountData.type === "percentage" ? "3" : "10"}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {discountData.type === "percentage" ? (
                        <FaPercent className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FaMoneyBillWave className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {discountData.type === "percentage"
                      ? "Enter a value between 0 and 100 percent"
                      : "Enter the discount amount in Indian Rupees"}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDiscountModalOpen(false);
                      setEditingBranchId(null);
                      setDiscountData({
                        type: "percentage",
                        requested_range: "",
                        requested_amount: ""
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={discountLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-75"
                  >
                    {discountLoading ? "Sending..." : "Request Discount"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manual Fees Modal */}
        {isFeesModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Set Manual Fees
                </h2>
                <button
                  onClick={() => {
                    setIsFeesModalOpen(false);
                    setEditingBranchId(null);
                    setFeesData({
                      admission_fee: "",
                      monthly_fee: "",
                      annual_fee: "",
                      other_fees: ""
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}