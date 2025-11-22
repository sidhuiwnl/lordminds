import React, { useState, useMemo } from "react";
import ActionButtons from "./common/ActionButton";
import { toast } from "react-toastify";
import Swal from "sweetalert2";


const AssignmentTable = ({
  data,
  page,
  rowsPerPage,
  onPrev,
  onNext,
  formatDate,
  onPageChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      `${row.department_name} ${row.assignment_topic}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const filteredTotal = filteredData.length;
  const filteredTotalPages = Math.ceil(filteredTotal / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage + 1;
  const endIdx = Math.min(page * rowsPerPage, filteredTotal);
  const paginated = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleEditClick = (assignment) => {
    setSelectedAssignment(assignment);
    setNewFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    setNewFile(e.target.files[0]);
  };

  const handleUpdateFile = async () => {
    if (!newFile) {
      toast.error("Please select a new file to upload!");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("file", newFile);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/tests/update-file/${selectedAssignment.assignment_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "File updated successfully!");
        setIsModalOpen(false);
        window.location.reload();
      } else {
        toast.error(data.detail || "Failed to update file.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
    setNewFile(null);
  };


  const handleDeleteAssignment = async (assignment) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `Do you want to delete "${assignment.assignment_topic}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API_URL}/tests/delete/${assignment.assignment_id}`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      }
    );

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        toast: true,
        icon: "success",
        title: data.message || "Assignment deleted successfully!",
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
      });

      setTimeout(() => window.location.reload(), 1000);
    } else {
      Swal.fire({
        toast: true,
        icon: "error",
        title: data.detail || "Failed to delete assignment.",
        position: "top-end",
        showConfirmButton: false,
        timer: 1800,
      });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    Swal.fire({
      toast: true,
      icon: "error",
      title: "Something went wrong while deleting!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1800,
    });
  }
};


  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          List of Uploaded Assignments
        </h2>
        <input
          type="text"
          placeholder="Search by Department or Topic..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (onPageChange) onPageChange(1);
          }}
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full min-w-[950px] border-collapse">
          <thead>
            <tr className="bg-[#1b64a5] text-white sticky top-0">
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">S.No</th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">Department</th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">Topic</th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">Start Date</th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">End Date</th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">File</th>
              <th className="px-4 py-3 border border-gray-500 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {paginated.length > 0 ? (
              paginated.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{startIdx + idx}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{row.department_name}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{row.assignment_topic}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{formatDate(row.start_date)}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{row.end_date ? formatDate(row.end_date) : "No End Date"}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{row.file_name}</td>
                  <td className="px-4 py-3 border border-gray-400 text-center">
                    <ActionButtons row={row} onEdit={handleEditClick} onDelete={handleDeleteAssignment} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500 text-sm border border-gray-300">
                  No matching assignments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 flex justify-between items-center border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-700">
          Showing {paginated.length > 0 ? startIdx : 0} to{" "}
          {paginated.length > 0 ? endIdx : 0} of {filteredTotal} entries
        </p>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} disabled={page <= 1} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {filteredTotalPages || 1}
          </span>
          <button onClick={onNext} disabled={page >= filteredTotalPages} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
            Next
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedAssignment && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
          onClick={handleModalClose}
        >
          <div 
            className="relative bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-full max-w-lg mx-4 border border-white/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Update Assignment File
            </h3>

            {/* Close Button */}
            <button
              onClick={handleModalClose}
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

            <div className="space-y-4 mb-4">
              <div>
                <p className="block text-sm font-medium text-gray-700">Assignment Topic:</p>
                <p className="mt-1 font-medium text-gray-900">{selectedAssignment.assignment_topic}</p>
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700">Department:</p>
                <p className="mt-1 font-medium text-gray-900">{selectedAssignment.department_name}</p>
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700">Current File:</p>
                <p className="mt-1 font-medium text-blue-600">{selectedAssignment.file_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload New File
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 gap-3">
              <button
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFile}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm 
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentTable;