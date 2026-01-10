import { useEffect, useState } from "react";
import axios from "../../../api/axiosConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCheckCircle,
  FaSpinner,
  FaFilePdf,
} from "react-icons/fa";

const Issued = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [issuingId, setIssuingId] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  // 🔹 Fetch certificates (GET)
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get("/admin/certificates/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.success) {
        setCertificates(res.data.data || []);
      } else {
        toast.error("Invalid response from server");
      }
    } catch (error) {
      toast.error("Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Issue certificate (POST)
  const issueCertificate = async (certificateId) => {
    try {
      setIssuingId(certificateId);
      const token = localStorage.getItem("token");

      await axios.post(
        `/admin/certificates/${certificateId}/issue`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Certificate issued successfully!");
      fetchCertificates(); // refresh list
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to issue certificate"
      );
    } finally {
      setIssuingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Certificates List
        </h1>
        <p className="text-gray-600">
          Total {certificates.length} certificates found
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-12 gap-4 bg-gray-100 p-4 font-semibold text-gray-700">
          <div className="col-span-2">Certificate No</div>
      
          <div className="col-span-3">Student</div>
          <div className="col-span-3">Course</div>
          <div className="col-span-2">Status</div>
          {/* <div className="col-span-2 text-center">Action</div> */}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-10 text-center text-gray-500">
            <FaSpinner className="animate-spin inline mr-2" />
            Loading certificates...
          </div>
        ) : certificates.length > 0 ? (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="grid grid-cols-12 gap-4 p-4 items-center border-t hover:bg-gray-50"
            >
              <div className="col-span-2 text-gray-700 font-medium">
                {cert.certificate_number || "—"}
              </div>
              {/* Student */}
              <div className="col-span-3">
                <p className="font-semibold text-gray-800">
                  {cert.student?.full_name}
                </p>
              </div>

              {/* Course */}
              <div className="col-span-3">
                <span className="px-3 py-1 bg-purple-100 text-gray-800 rounded-full text-sm">
                  {cert.course?.course_name}
                </span>
              </div>

              {/* Certificate Number */}


              {/* Status */}
              <div className="col-span-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${cert.status === "issued"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                  {cert.status}
                </span>
              </div>

              {/* Action */}
              {/* <div className="col-span-2 flex justify-center">
                {cert.status === "issued" ? (
                  <span className="text-blue-600 flex items-center space-x-1">
                    <FaCheckCircle />
                    <span>Issue Now</span>
                  </span>
                ) : (
                  <button
                    onClick={() => issueCertificate(cert.id)}
                    disabled={issuingId === cert.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {issuingId === cert.id ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Issuing</span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        <span>Issue</span>
                      </>
                    )}
                  </button>
                )}
              </div> */}
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-500">
            <FaFilePdf className="text-5xl mb-3 mx-auto" />
            No certificates found
          </div>
        )}
      </div>
    </div>
  );
};

export default Issued;
