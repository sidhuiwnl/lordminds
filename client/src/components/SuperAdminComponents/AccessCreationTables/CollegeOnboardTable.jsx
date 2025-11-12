import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Select from "react-select"


const EditCollegeModal = ({ college, onClose, onUpdateSuccess }) => {
  const [name, setName] = useState(college.name);
  const [location, setLocation] = useState(college.college_address);
  const [departments, setDepartments] = useState([]); // all depts
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_API_URL}/departments/get-departments`
        );
        if (res.data.status === "success") {
          setDepartments(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch departments:", err);
        toast.error("Could not load departments.");
      }
    };
    fetchDepartments();
  }, []);

  // 🔹 Prepare department dropdown options (excluding already assigned ones)
const departmentOptions = departments
  .filter(
    (dept) => !college.departments.some((cd) => cd.department_id === dept.department_id)
  )
  .map((dept) => ({
    value: dept.department_id,
    label: dept.department_name,
  }));


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();

    if (name !== college.name) formData.append("name", name);
    if (location !== college.college_address)
      formData.append("location", location);
    if (selectedDepartments.length > 0)
      formData.append(
        "department_ids",
        selectedDepartments.map((d) => d.value).join(",")
      );

    if (
      !formData.has("name") &&
      !formData.has("location") &&
      !formData.has("department_ids")
    ) {
      setError("No changes detected.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_API_URL}/colleges/update/${college.college_id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.status === "success") {
        toast.success("College updated successfully!");
        onUpdateSuccess(response.data.message);
        onClose();
      } else {
        setError(response.data.detail || "Update failed.");
      }
    } catch (err) {
      console.error("Error updating college:", err);
      setError(err.response?.data?.detail || "Unexpected error during update.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-full max-w-lg mx-4 border border-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Edit College: {college.name}
        </h3>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* College Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              College Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* College Address */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              College Address
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Add Departments Dropdown */}
          <div>
            <label
              htmlFor="departments"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Add Departments
            </label>
            <Select
              id="departments"
              isMulti
              options={departmentOptions}
              value={selectedDepartments}
              onChange={setSelectedDepartments}
              className="react-select-container text-sm text-black"
              classNamePrefix="react-select"
              placeholder="Select departments..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Existing departments are disabled.
            </p>
          </div>

          {/* Error */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
              rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm 
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ------------------ College Table ------------------
export const CollegeTable = ({
  collegesWithDepts,
  rowsPerPage = 10,
  onPageChange,
  refreshData,
}) => {
  const [collegePage, setCollegePage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (onPageChange) onPageChange("college", collegePage);
  }, [collegePage, onPageChange]);

  /* 🔍 Combine filters + search */
  const filteredColleges = useMemo(
    () =>
      (collegesWithDepts || []).filter(
        (college) => {
          const query = searchQuery.toLowerCase();
          return (
            college.name.toLowerCase().includes(query) ||
            college.departments.some(
              (d) => d.department_name.toLowerCase().includes(query)
            )
          );
        }
      ),
    [collegesWithDepts, searchQuery]
  );

  const total = filteredColleges.length;
  const totalPages = Math.ceil(total / rowsPerPage);

  const paginatedColleges = useMemo(
    () =>
      filteredColleges.slice(
        (collegePage - 1) * rowsPerPage,
        collegePage * rowsPerPage
      ),
    [filteredColleges, collegePage, rowsPerPage]
  );

  const handleEditCollege = (college) => {
    setSelectedCollege(college);
    setIsModalOpen(true);
    setSuccessMessage(null);
  };

  const handleUpdateSuccess = (message) => {
    toast.success(message || "College updated successfully!");
    setSuccessMessage(message);
    if (refreshData) refreshData();
  };

 
const handleDeleteCollege = async (college) => {
  toast.info(`Deleting ${college.name}...`);

  try {
    const res = await axios.delete(
      `${import.meta.env.VITE_BACKEND_API_URL}/colleges/delete/${college.college_id}`
    );

    if (res.data.status === "success") {
      toast.success(`${college.name} deleted successfully!`);
      if (refreshData) refreshData();
    } else {
      // Backend sent a failure message (e.g., constraint)
      toast.error(res.data.message || "Failed to delete college.");
    }
  } catch (err) {
    console.error("Delete error:", err);

    // Handle MySQL constraint error (code 1451)
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.detail ||
      err.message;

    if (errorMessage?.includes("1451") || errorMessage?.includes("foreign key")) {
      toast.error(
        "Cannot delete this college because students or teachers are mapped to it."
      );
    } else {
      toast.error("An unexpected error occurred while deleting college.");
    }
  }
};

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
      {successMessage && (
        <div
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4"
          role="alert"
        >
          <p className="font-bold">Success!</p>
          <p>{successMessage}</p>
        </div>
      )}

      <div className="flex justify-between items-center p-4 lg:p-6 border-b border-gray-200">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800">
          List of Colleges
        </h2>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 gap-4 mb-4">
          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search College
            </label>
            <input
              type="text"
              placeholder="Search by name or department..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCollegePage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="bg-[#1b64a5] text-white sticky top-0">
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-400">S.NO</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-400">College Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-400">Address</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-400">Departments</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-400">Created At</th>
              <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {paginatedColleges.map((college, index) => (
              <tr key={college.college_id}>
                <td className="px-4 py-3 border border-gray-300 text-sm">
                  {(collegePage - 1) * rowsPerPage + index + 1}
                </td>
                <td className="px-4 py-3 border border-gray-300 text-sm">{college.name}</td>
                <td className="px-4 py-3 border border-gray-300 text-sm">{college.college_address}</td>
                <td className="px-4 py-3 border border-gray-300 text-sm">
                  {college.departments.map((d) => d.name).join(", ")}
                </td>
                <td className="px-4 py-3 border border-gray-300 text-sm">
                  {formatDate(college.created_at)}
                </td>
                <td className="px-4 py-3 border border-gray-300 text-center">
                  <div className="flex justify-center items-center gap-3">
                    <svg
                      className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={() => handleEditCollege(college)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                         m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9
                         v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <svg
                      className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={() => handleDeleteCollege(college)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
                         a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6
                         m1-10V4a1 1 0 00-1-1h-4a1 1 0
                         00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {Math.min((collegePage - 1) * rowsPerPage + 1, total)} to{" "}
          {Math.min(collegePage * rowsPerPage, total)} of {total} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollegePage((p) => Math.max(p - 1, 1))}
            disabled={collegePage <= 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {collegePage} of {totalPages}
          </span>
          <button
            onClick={() => setCollegePage((p) => Math.min(p + 1, totalPages))}
            disabled={collegePage >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && selectedCollege && (
        <EditCollegeModal
          college={selectedCollege}
          onClose={() => setIsModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};