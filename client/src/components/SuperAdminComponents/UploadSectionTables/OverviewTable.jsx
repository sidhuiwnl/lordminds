import React, { useState, useMemo, useRef } from "react";
import ActionButtons from "./common/ActionButton";
import JoditEditor from "jodit-react";
import { toast } from "react-toastify";

const OverviewTable = ({
  data,
  page,
  rowsPerPage,
  total,
  totalPages,
  onPrev,
  onNext,
  onPageChange,
  refreshData, // optional: to reload table data after update/deactivate
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOverview, setSelectedOverview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const editor = useRef(null);

  /* ---------- FILTERING ---------- */
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      `${row.topic_name} ${row.sub_topic_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);


  console.log(data);

  const filteredTotal = filteredData.length;
  const filteredTotalPages = Math.ceil(filteredTotal / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage + 1;
  const endIdx = Math.min(page * rowsPerPage, filteredTotal);
  const paginated = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  /* ---------- EDIT HANDLER ---------- */
  const handleEditClick = (overview) => {
    setSelectedOverview(overview);
    setVideoUrl(overview.overview_video_url || "");
    setContent(overview.overview_content || "");
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOverview(null);
    setVideoUrl("");
    setContent("");
  };

  /* ---------- UPDATE OVERVIEW ---------- */
  const handleUpdateOverview = async () => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // ALWAYS send both fields
      // If user wants to clear video URL, send empty string
      formData.append("overview_video_url", videoUrl);

      // If user wants to clear content, send empty string  
      formData.append("overview_content", content);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/overviews/update-overview/${selectedOverview.sub_topic_id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Overview updated successfully!");
        setIsModalOpen(false);
        if (refreshData) refreshData();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.detail || "Failed to update overview.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while updating!");
    } finally {
      setIsSubmitting(false);
    }
  };
  /* ---------- DEACTIVATE SUBTOPIC ---------- */
  const handleDeactivate = async (overview) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate "${overview.sub_topic_name}"?`
      )
    )
      return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/overviews/deactivate-subtopic/${overview.sub_topic_id}`,
        { method: "PUT" }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Subtopic deactivated successfully!");
        if (refreshData) refreshData();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.detail || "Failed to deactivate subtopic.");
      }
    } catch (error) {
      console.error("Error deactivating subtopic:", error);
      toast.error("Something went wrong!");
    }
  };

  /* ---------- Jodit Config ---------- */
  const editorConfig = {
    readonly: false,
    height: 300,
    toolbar: true,
    buttons: ["bold", "italic", "underline", "ul", "ol", "link"],
    placeholder: "Enter or edit overview content...",
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          List of Uploaded Overviews
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
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">
                S.No
              </th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">
                Topic
              </th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">
                Sub-Topic
              </th>
              <th className="px-4 py-3 border border-gray-500 text-left text-sm font-semibold">
                Video URL
              </th>
              <th className="px-4 py-3 border border-gray-500 text-center text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {paginated.length > 0 ? (
              paginated.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 border border-gray-400 text-sm">
                    {startIdx + idx}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">
                    {row.topic_name}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">
                    {row.sub_topic_name}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-sm">
                    <a
                      href={row.overview_video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 truncate block max-w-xs"
                    >
                      {row.overview_video_url}
                    </a>
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-center">
                    <ActionButtons
                      row={row}
                      onEdit={handleEditClick}
                      onDelete={handleDeactivate}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-6 text-gray-500 text-sm border border-gray-300"
                >
                  No matching overviews found.
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
      {isModalOpen && selectedOverview && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50 p-4"
          onClick={handleModalClose}
        >
          <div
            className="relative bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-full max-w-4xl mx-4 border border-white/40 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Update Overview
            </h3>

            {/* Close */}
            <button
              onClick={handleModalClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>

            <div className="space-y-6 mb-4">
              {/* Topic/Subtopic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="block text-sm font-medium text-gray-700">
                    Topic:
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedOverview.topic_name}
                  </p>
                </div>
                <div>
                  <p className="block text-sm font-medium text-gray-700">
                    Sub-Topic:
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedOverview.sub_topic_name}
                  </p>
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Enter video URL"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Overview Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overview Content
                </label>
                <JoditEditor
                  ref={editor}
                  value={content}
                  config={editorConfig}
                  tabIndex={1}
                  onBlur={(newContent) => setContent(newContent)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end pt-4 border-t border-gray-200 gap-3">
              <button
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOverview}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Overview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTable;
