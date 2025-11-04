import { useEffect, useState } from "react";
import axios from "../../../api/axiosConfig";
import { FaTag, FaPercent, FaRupeeSign, FaCalendarAlt, FaBook, FaCopy, FaCheck } from "react-icons/fa";

function AllCoupans() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  // Copy coupon code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ✅ Fetch coupons on mount
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/coupons", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCoupons(res.data || []);
      } catch (error) {
        console.error("Error fetching coupons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  // Function to determine coupon color based on type
  const getCouponColor = (discountType) => {
    return discountType === "percentage" 
      ? "from-green-500 to-emerald-600" 
      : "from-blue-500 to-purple-600";
  };

  // Function to get status badge
  const getStatusBadge = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today ? "Expired" : "Active";
  };

  // Function to get status color
  const getStatusColor = (expiryDate) => {
    const status = getStatusBadge(expiryDate);
    return status === "Active" 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading coupons...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 font-nunito">
          Coupon Management
        </h1>
        <p className="text-gray-600 text-lg">
          Manage and track all your discount coupons
        </p>
      </div>

      {/* Stats and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FaTag className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{coupons.length}</h3>
              <p className="text-gray-600">Total Coupons</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <FaPercent className="text-green-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {coupons.filter(c => c.discount_type === "percentage").length}
              </h3>
              <p className="text-gray-600">Percentage Coupons</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <FaRupeeSign className="text-purple-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {coupons.filter(c => c.discount_type === "fixed").length}
              </h3>
              <p className="text-gray-600">Fixed Amount</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-xl">
              <FaCalendarAlt className="text-orange-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {coupons.filter(c => {
                  const expiry = new Date(c.expiry_date);
                  const today = new Date();
                  return expiry >= today;
                }).length}
              </h3>
              <p className="text-gray-600">Active Coupons</p>
            </div>
          </div>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FaTag className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-600 mb-2">No Coupons Available</h3>
          <p className="text-gray-500">Create your first coupon to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
            >
              {/* Coupon Header with Gradient */}
              <div className={`bg-gradient-to-r ${getCouponColor(coupon.discount_type)} p-6 text-white relative`}>
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(coupon.expiry_date)}`}>
                  {getStatusBadge(coupon.expiry_date)}
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FaTag className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Discount Coupon</h3>
                    <p className="text-white/80 text-sm">{coupon.discount_type === "percentage" ? "Percentage Off" : "Fixed Discount"}</p>
                  </div>
                </div>

                {/* Coupon Code - Copyable */}
                <div className="bg-white/20 rounded-xl p-4 text-center mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold tracking-wider">{coupon.code}</span>
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className="bg-white/30 hover:bg-white/40 p-2 rounded-lg transition-all duration-200"
                    >
                      {copiedCode === coupon.code ? (
                        <FaCheck className="text-green-400" />
                      ) : (
                        <FaCopy className="text-white" />
                      )}
                    </button>
                  </div>
                  <p className="text-white/70 text-xs mt-2">Click to copy code</p>
                </div>
              </div>

              {/* Coupon Body */}
              <div className="p-6">
                {/* Discount Value */}
                <div className="text-center mb-6">
                  <div className={`text-3xl font-bold ${
                    coupon.discount_type === "percentage" ? "text-green-600" : "text-blue-600"
                  }`}>
                    {coupon.discount_type === "percentage" ? (
                      <span>{coupon.discount_value}% OFF</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <FaRupeeSign className="text-lg" />
                        {coupon.discount_value} OFF
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {coupon.discount_type === "percentage" ? "Percentage Discount" : "Fixed Amount Discount"}
                  </p>
                </div>

                {/* Course Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaBook className="text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Course</p>
                      <p className="font-semibold text-gray-800 truncate">
                        {coupon.course?.course_name || "Any Course"}
                      </p>
                    </div>
                  </div>

                  {/* Validity Period */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaCalendarAlt className="text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Valid From</p>
                      <p className="font-semibold text-gray-800 text-sm">{coupon.start_date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaCalendarAlt className="text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Expires On</p>
                      <p className="font-semibold text-gray-800 text-sm">
                        {coupon.expiry_date || "No Expiry"}
                      </p>
                    </div>
                  </div>
                </div>

 
              </div>


            </div>
          ))}
        </div>
      )}

      {/* Copy Success Toast */}
      {copiedCode && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <FaCheck className="text-lg" />
          <span>Copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}

export default AllCoupans;