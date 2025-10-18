import React, { useState, useEffect } from 'react';
import axios from "../../../api/axiosConfig";
import SAAdminLayout from "../../../layouts/Sinfodeadmin";

const Discount = () => {
  const [discountRequests, setDiscountRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestType, setRequestType] = useState('percentage');
  const [requestedValue, setRequestedValue] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const fetchDiscountRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/discount-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiscountRequests(response.data);
    } catch (err) {
      setError('Failed to load discount requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountRequests();
  }, []);

  const submitDiscountRequest = async () => {
    const value = Number(requestedValue);
    if (!value || isNaN(value)) {
      setError('Please enter a valid value');
      return;
    }
    try {
      setRequesting(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const payload = requestType === 'percentage'
        ? { requested_range: value }
        : { requested_amount: value };
      await axios.post(`/branches/${user.branch_id}/discount-request`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Discount request submitted successfully!');
      setShowRequestModal(false);
      setRequestedValue('');
      fetchDiscountRequests();
    } catch (err) {
      setError('Failed to submit discount request');
    } finally {
      setRequesting(false);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/discount-requests/${requestId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Request ${status} successfully!`);
      fetchDiscountRequests();
    } catch (err) {
      setError('Failed to update request status');
    }
  };

  const getStatusBadge = (status) => {
    const baseStyle = "px-3 py-1 rounded-full text-white text-xs font-medium";
    switch (status) {
      case 'approved':
        return <span className={`${baseStyle} bg-green-500`}>✅ Approved</span>;
      case 'rejected':
        return <span className={`${baseStyle} bg-red-500`}>❌ Rejected</span>;
      default:
        return <span className={`${baseStyle} bg-yellow-500`}>⏳ Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700 text-lg">Loading discount requests...</div>
      </div>
    );
  }

  return (
    <SAAdminLayout>
      <div className="py-6 px-4 min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Discount Request History</h1>
            <button
              className="mt-3 px-4 py-2 rounded bg-blue-600 text-white text-sm"
              onClick={() => setShowRequestModal(true)}>
              New Discount Request
            </button>
          </div>

          {/* Request List */}
          <div className="space-y-4">
            {discountRequests.length > 0 ? (
              discountRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-center border-b pb-3 mb-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {request.branch?.branch_name || 'Unknown Branch'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Requested by: {request.requester?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  {/* Clean grid: Four labeled boxes, clearly separated */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-4">
                    <div className="bg-gray-50 border rounded-md p-2 text-center">
                      <h3 className="text-xs text-gray-500 mb-1">Previous Discount (%)</h3>
                      <div className="text-lg font-bold text-blue-700">{request.current_range !== null ? `${request.current_range}%` : '-'}</div>
                    </div>
                    <div className="bg-gray-50 border rounded-md p-2 text-center">
                      <h3 className="text-xs text-gray-500 mb-1">Previous Discount (₹)</h3>
                      <div className="text-lg font-bold text-blue-700">{request.current_amount !== null ? `₹${request.current_amount}` : '-'}</div>
                    </div>
                    <div className="bg-gray-50 border rounded-md p-2 text-center">
                      <h3 className="text-xs text-gray-500 mb-1">Requested Discount (%)</h3>
                      <div className="text-lg font-bold text-green-700">{request.requested_range !== null ? `${request.requested_range}%` : '-'}</div>
                    </div>
                    <div className="bg-gray-50 border rounded-md p-2 text-center">
                      <h3 className="text-xs text-gray-500 mb-1">Requested Discount (₹)</h3>
                      <div className="text-lg font-bold text-green-700">{request.requested_amount !== null ? `₹${request.requested_amount}` : '-'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-5 justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span>Request Date: </span>
                      <span className="font-medium">
                        {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateRequestStatus(request.id, 'rejected')}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateRequestStatus(request.id, 'approved')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-600">
                <p>No discount requests available at this time.</p>
              </div>
            )}
          </div>

          {/* Modal */}
          {showRequestModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">New Discount Request</h2>
                <div className="mb-2 flex gap-6">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={requestType === 'percentage'}
                      onChange={() => setRequestType('percentage')}
                      className="accent-blue-600"
                    /> <span className="text-sm">Percentage (%)</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={requestType === 'amount'}
                      onChange={() => setRequestType('amount')}
                      className="accent-blue-600"
                    /> <span className="text-sm">Amount (₹)</span>
                  </label>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 mb-1">
                    {requestType === 'percentage' ? 'Requested Discount (%)' : 'Requested Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={requestedValue}
                    onChange={e => setRequestedValue(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={requestType === 'percentage' ? "e.g. 15" : "e.g. 5000"}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitDiscountRequest}
                    disabled={requesting}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {requesting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
                {error && <div className="text-red-500 mt-2">{error}</div>}
              </div>
            </div>
          )}

        </div>
      </div>
    </SAAdminLayout>
  );
};

export default Discount;
