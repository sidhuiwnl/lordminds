import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";



/* ---------------- EditTopicModal Component ---------------- */
const EditTopicModal = ({ topic, onClose, onUpdateSuccess }) => {
  const [topicName, setTopicName] = useState(topic.topic_name);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_BACKEND_API_URL;

  useEffect(() => {
    const fetchAvailableTopics = async () => {
      try {
        const res = await axios.get(`${API_BASE}/topics/all-topics`);
        if (res.data.status === "success") {
          const allTopics = res.data.data.map((t) => t.topic_name);
          const assignedRes = await axios.get(`${API_BASE}/topics/topic-with-department`);
          const assignedTopics = assignedRes.data.data
            .filter(
              (t) =>
                t.department_id === topic.department_id &&
                t.college_id === topic.college_id
            )
            .map((t) => t.topic_name);

          const remaining = allTopics.filter(
            (t) => !assignedTopics.includes(t) || t === topic.topic_name
          );
          setAvailableTopics(remaining);
        } else {
          setAvailableTopics([topic.topic_name]);
        }
      } catch (err) {
        setAvailableTopics([topic.topic_name]);
      }
    };
    fetchAvailableTopics();
  }, [topic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("college_id", topic.college_id);
    formData.append("department_id", topic.department_id);
    formData.append("new_topic_name", topicName);

    if (topicName === topic.topic_name) {
      setError("No changes detected.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.put(
        `${API_BASE}/topics/update/${topic.topic_id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.status === "success") {
        Swal.fire({
          toast: true,
          icon: "success",
          title: "Topic assignment updated successfully!",
          position: "top-end",
          showConfirmButton: false,
          timer: 1800,
        });
        onUpdateSuccess();
        onClose();
      } else if (res.data.status === "error") {
        setError(res.data.detail || "Update failed.");
      } else {
        setError("Unexpected server response.");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unexpected error occurred.";
      setError(errorMessage);
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
          Edit Topic Assignment
        </h3>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">College</label>
            <input
              type="text"
              value={topic.college_name}
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              value={topic.department_name}
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Current Topic</label>
            <input
              type="text"
              value={topic.topic_name}
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select New Topic
            </label>
            <select
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {availableTopics.map((topicOption) => (
                <option key={topicOption} value={topicOption}>
                  {topicOption}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {availableTopics.length} available topics
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
              rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm 
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading || topicName === topic.topic_name}
            >
              {isLoading ? "Updating..." : "Update Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- TopicTable Component ---------------- */
export const TopicTable = () => {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topicPage, setTopicPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const rowsPerPage = 10;

  const API_BASE = import.meta.env.VITE_BACKEND_API_URL;

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/topics/topic-with-department`);
      if (res.data.status === "success") {
        setTopics(res.data.data);
      } else {
        Swal.fire({
          toast: true,
          icon: "error",
          title: res.data.detail || "Failed to load topics.",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Error fetching topics.";
      Swal.fire({
        toast: true,
        icon: "error",
        title: errorMessage,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) =>
      `${topic.topic_name} ${topic.department_name} ${topic.college_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [topics, searchQuery]);

  const topicTotal = filteredTopics.length;
  const topicTotalPages = Math.ceil(topicTotal / rowsPerPage);
  const paginatedTopics = useMemo(
    () =>
      filteredTopics.slice(
        (topicPage - 1) * rowsPerPage,
        topicPage * rowsPerPage
      ),
    [filteredTopics, topicPage]
  );

  const handleEditTopic = (topic) => {
    setSelectedTopic(topic);
    setIsModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchTopics();
    setIsModalOpen(false);
  };

  const handleDeleteTopic = async (topic) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${topic.topic_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${API_BASE}/topics/delete/${topic.topic_id}`
      );

      if (res.data.status === "success") {
        Swal.fire({
          toast: true,
          icon: "success",
          title: `"${topic.topic_name}" deleted successfully!`,
          position: "top-end",
          showConfirmButton: false,
          timer: 1800,
        });
        fetchTopics();
      } else if (res.data.status === "error") {
        Swal.fire({
          toast: true,
          icon: "error",
          title: res.data.detail || "Failed to delete topic.",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        Swal.fire({
          toast: true,
          icon: "error",
          title: "Unexpected server response.",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unexpected error while deleting topic.";
      Swal.fire({
        toast: true,
        icon: "error",
        title: errorMessage,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <p className="text-gray-600">Loading topics...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800">
          List of Topics
        </h2>
        <input
          type="text"
          placeholder="Search by topic, department, or college..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setTopicPage(1);
          }}
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-[#1b64a5] text-white sticky top-0">
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">S.NO</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">Topic Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">Department</th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">College</th>
              <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500">
            {paginatedTopics.length > 0 ? (
              paginatedTopics.map((topic, index) => (
                <tr key={topic.topic_id}>
                  <td className="px-4 py-3 border border-gray-500 text-sm">
                    {(topicPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 border border-gray-500 text-sm">{topic.topic_name}</td>
                  <td className="px-4 py-3 border border-gray-500 text-sm">{topic.department_name}</td>
                  <td className="px-4 py-3 border border-gray-500 text-sm">{topic.college_name}</td>
                  <td className="px-4 py-3 border border-gray-500 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <svg
                        className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        onClick={() => handleEditTopic(topic)}
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
                        onClick={() => handleDeleteTopic(topic)}
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
                <td
                  colSpan="5"
                  className="px-4 py-6 text-center text-gray-600 text-sm"
                >
                  No topics found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {(topicPage - 1) * rowsPerPage + 1} to{" "}
          {Math.min(topicPage * rowsPerPage, topicTotal)} of {topicTotal} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTopicPage((p) => Math.max(p - 1, 1))}
            disabled={topicPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {topicPage} of {topicTotalPages || 1}
          </span>
          <button
            onClick={() => setTopicPage((p) => Math.min(p + 1, topicTotalPages))}
            disabled={topicPage >= topicTotalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && selectedTopic && (
        <EditTopicModal
          topic={selectedTopic}
          onClose={() => setIsModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};
