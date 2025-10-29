import { useState, useEffect } from "react";
import axios from "../../../api/axiosConfig";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

function CreateCategory() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [userBranch, setUserBranch] = useState(null);

  // ✅ Get user data from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userBranchId = userData.branch_id;
    
    if (userBranchId) {
      setUserBranch(userBranchId);
    } else {
      toast.error("No branch assigned to user! Please contact administrator.");
    }
  }, []);

  // ✅ Submit Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userBranch) {
      setMessage("❌ No branch assigned to user");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found! Please login again.");
        return;
      }

      const payload = {
        name: name,
        branch_id: Number(userBranch), // 👈 Use user's branch id
      };

      const res = await axios.post("/categories", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(` Category Created: ${res.data.name}`);
      toast.success(` Category Created: ${res.data.name}`);
      setName("");
    } catch (err) {
      console.error(err);
      setMessage("Error creating category");
      toast.error("Error creating category");
    }
  };

  return (
    <div className="items-center flex justify-center mt-10">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Category</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Category Name
            </label>
            <input
              type="text"
              placeholder="Enter category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
              required
            />
          </div>

          {/* Display User's Branch (Read-only) */}
          {/* <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Branch
            </label>
            <input
              type="text"
              value={userBranch ? `Branch ID: ${userBranch}` : "Loading..."}
              className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              readOnly
              disabled
            />
          </div>

          Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Category
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm font-medium text-green-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default CreateCategory;