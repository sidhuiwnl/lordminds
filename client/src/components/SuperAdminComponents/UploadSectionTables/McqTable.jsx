import React, { useState, useMemo } from "react";
import ActionButtons from "./common/ActionButton";
import { toast } from "react-toastify";

const McqTable = ({
  data,
  page,
  rowsPerPage,
  total,
  totalPages,
  onPrev,
  onNext,
  onPageChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMcq, setSelectedMcq] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("MCQ Table Data:", data);

  /* ---------------- Search Filter ---------------- */
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      `${row.topic_name} ${row.sub_topic_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const filteredTotal = filteredData.length;
  const filteredTotalPages = Math.ceil(filteredTotal / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage + 1;
  const endIdx = Math.min(page * rowsPerPage, filteredTotal);
  const paginated = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  /* ---------------- Modal Handlers ---------------- */
  const handleEditClick = (mcq) => {
    setSelectedMcq(mcq);
    setNewFile(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMcq(null);
    setNewFile(null);
  };

  const handleFileChange = (e) => {
    setNewFile(e.target.files[0]);
  };

  /* ---------------- Update File ---------------- */
  const handleUpdateFile = async () => {
    if (!newFile) {
      toast.error("Please select a new Excel file!");
      return;
    }

    const allowedExtensions = [".xlsx", ".xls"];
    if (!allowedExtensions.some((ext) => newFile.name.toLowerCase().endsWith(ext))) {
      toast.error("Only Excel (.xlsx, .xls) files are allowed!");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("file", newFile);

      // ✅ Correct backend route for sub_topic update
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/tests/update-file/subtopic/${selectedMcq.sub_topic_id}`,
        {
          method: "PUT",
          headers: { Accept: "application/json" },
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          List of Uploaded MCQs
        </h2>
        <input
          type="text"
          placeholder="Search by Topic or Sub-Topic..."
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
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">Topic</th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">Sub-Topic</th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">Total Questions</th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">File</th>
              <th className="px-4 py-3 border border-gray-500 text-center text-sm font-semibold">Edit</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-300">
            {paginated.length > 0 ? (
              paginated.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{startIdx + idx}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{row.topic_name}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{row.sub_topic_name}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">{row.total_questions}</td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">
                    {row.file_name ? (
                      <a
                        href={row.test_file || "#"}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {row.file_name}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No file</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-center">
                    {row.file_name ? (
                      <svg
                        onClick={() => handleEditClick(row)}
                        className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700 inline-block"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    ) : (
                      <span className="text-gray-400 text-xs italic">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 text-gray-500 text-sm border border-gray-300"
                >
                  No matching MCQs found.
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
          <button
            onClick={onPrev}
            disabled={page <= 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {filteredTotalPages || 1}
          </span>
          <button
            onClick={onNext}
            disabled={page >= filteredTotalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedMcq && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
          onClick={handleModalClose}
        >
          <div
            className="relative bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-full max-w-lg mx-4 border border-white/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Update Sub-Topic Question File
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

            {/* Info + File Upload */}
            <div className="space-y-4 mb-4">
              <div>
                <p className="block text-sm font-medium text-gray-700">Topic:</p>
                <p className="mt-1 font-medium text-gray-900">{selectedMcq.topic_name}</p>
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700">Sub-Topic:</p>
                <p className="mt-1 font-medium text-gray-900">{selectedMcq.sub_topic_name}</p>
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700">Current File:</p>
                <p className="mt-1 font-medium text-blue-600">{selectedMcq.file_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload New File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: Excel (.xlsx, .xls)
                </p>
              </div>
            </div>

            {/* Modal Actions */}
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
                disabled={isSubmitting || !newFile}
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

export default McqTable;
