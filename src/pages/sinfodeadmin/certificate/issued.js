import { useEffect, useState } from "react";
import axios from "../../../api/axiosConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaSpinner,
  FaFilePdf,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

const Issued = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  // 🔹 Fetch certificates
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get("/admin/certificates/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setCertificates(res.data.data || []);
      }
    } catch {
      toast.error("Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Toggle Status (issued ↔ inactive)
  const toggleStatus = async (id) => {
    try {
      setActionId(id);
      const token = localStorage.getItem("token");

      const res = await axios.patch(
        `/admin/certificates/${id}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(res.data.message);

      // ✅ Update only that certificate locally
      setCertificates((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: res.data.status } : c
        )
      );
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionId(null);
    }
  };

  // 🔹 Delete Certificate
  const deleteCertificate = async (id) => {
    if (!window.confirm("This will permanently delete the certificate."))
      return;

    try {
      setActionId(id);
      const token = localStorage.getItem("token");

      await axios.delete(`/admin/certificates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Certificate deleted successfully");
      setCertificates((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Failed to delete certificate");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer />

      <h1 className="text-2xl font-bold mb-4">Certificates List</h1>

      <div className="bg-white rounded shadow">
        <div className="grid grid-cols-12 p-4 bg-gray-100 font-semibold">
          <div className="col-span-2">Cert No</div>
          <div className="col-span-3">Student</div>
          <div className="col-span-3">Course</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-center">Action</div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <FaSpinner className="animate-spin inline mr-2" />
            Loading...
          </div>
        ) : certificates.length ? (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="grid grid-cols-12 p-4 border-t items-center"
            >
              <div className="col-span-2">
                {cert.certificate_number}
              </div>

              <div className="col-span-3 font-semibold">
                {cert.student?.full_name}
              </div>

              <div className="col-span-3">
                {cert.course?.course_name}
              </div>

              {/* STATUS */}
              <div className="col-span-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    cert.status === "issued"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {cert.status}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="col-span-2 flex justify-center gap-4">
                <button
                  onClick={() => toggleStatus(cert.id)}
                  disabled={actionId === cert.id}
                  title="Activate / Deactivate"
                >
                  {cert.status === "issued" ? (
                    <FaToggleOn size={22} className="text-green-600" />
                  ) : (
                    <FaToggleOff size={22} className="text-gray-500" />
                  )}
                </button>

                <button
                  onClick={() => deleteCertificate(cert.id)}
                  disabled={actionId === cert.id}
                  title="Delete"
                >
                  <FaTrash className="text-red-600" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-gray-500">
            <FaFilePdf size={40} className="mx-auto mb-2" />
            No certificates found
          </div>
        )}
      </div>
    </div>
  );
};

export default Issued;
