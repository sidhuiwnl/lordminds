import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";

/* ---------------- Edit Teacher Modal ---------------- */
const EditTeacherModal = ({ teacher, onClose, onUpdateSuccess }) => {
  const [username, setUsername] = useState(teacher.username);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    if (username !== teacher.username) formData.append("username", username);
    if (password.trim() !== "") formData.append("password", password);

    if (!formData.has("username") && !formData.has("password")) {
      setError("No changes detected.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_API_URL}/teachers/update/${teacher.user_id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.status === "success") {
        toast.success("Teacher updated successfully!");
        onUpdateSuccess();
        onClose();
      } else {
        setError(res.data.detail || "Update failed.");
      }
    } catch (err) {
      console.error("Error updating teacher:", err);
      setError(err.response?.data?.detail || "Unexpected error occurred.");
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
        className="relative bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Edit Teacher: {teacher.username}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password (optional)
            </label>
            <input
              type="password"
              id="password"
              placeholder="Leave blank to keep same password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

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

/* ---------------- Teacher Table ---------------- */
export const TeacherTable = ({ teachers, rowsPerPage = 10, onPageChange, refreshData }) => {
  const [teacherPage, setTeacherPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (onPageChange) onPageChange("teacher", teacherPage);
  }, [teacherPage]);

  /* Search filter */
  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) =>
        teacher.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.college_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  const teacherTotal = filteredTeachers.length;
  const teacherTotalPages = Math.ceil(teacherTotal / rowsPerPage);
  const paginatedTeachers = useMemo(
    () =>
      filteredTeachers.slice(
        (teacherPage - 1) * rowsPerPage,
        teacherPage * rowsPerPage
      ),
    [filteredTeachers, teacherPage]
  );

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    toast.success("Teacher updated successfully!");
    if (refreshData) refreshData();
  };

  const handleDeleteTeacher = async (teacher) => {
    if (!window.confirm(`Are you sure you want to delete ${teacher.username}?`))
      return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_API_URL}/teachers/delete/${teacher.user_id}`
      );

      if (res.data.status === "success") {
        toast.success(`${teacher.username} deleted successfully!`);
        if (refreshData) refreshData();
      } else {
        toast.error(res.data.detail || "Failed to delete teacher.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      const errorMessage =
        err.response?.data?.detail || "Unexpected error while deleting teacher.";
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800">
          List of Teachers
        </h2>
        <input
          type="text"
          placeholder="Search by username or college..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setTeacherPage(1);
          }}
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-[#1b64a5] text-white sticky top-0">
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">S.NO</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">College Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">Created At</th>
              <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500">
            {paginatedTeachers.length > 0 ? (
              paginatedTeachers.map((teacher, index) => (
                <tr key={teacher.user_id}>
                  <td className="px-4 py-3 border border-gray-500 text-sm">
                    {(teacherPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 border border-gray-500 text-sm">
                    {teacher.username}
                  </td>
                  <td className="px-4 py-3 border border-gray-500 text-sm">
                    {teacher.college_name}
                  </td>
                  <td className="px-4 py-3 border border-gray-500 text-sm">
                    {formatDate(teacher.created_at)}
                  </td>
                  <td className="px-4 py-3 border border-gray-500 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <svg
                        className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        onClick={() => handleEditTeacher(teacher)}
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
                        onClick={() => handleDeleteTeacher(teacher)}
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
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-600 text-sm">
                  No teachers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {(teacherPage - 1) * rowsPerPage + 1} to{" "}
          {Math.min(teacherPage * rowsPerPage, teacherTotal)} of {teacherTotal} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTeacherPage((p) => Math.max(p - 1, 1))}
            disabled={teacherPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {teacherPage} of {teacherTotalPages}
          </span>
          <button
            onClick={() => setTeacherPage((p) => Math.min(p + 1, teacherTotalPages))}
            disabled={teacherPage >= teacherTotalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && selectedTeacher && (
        <EditTeacherModal
          teacher={selectedTeacher}
          onClose={() => setIsModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};
