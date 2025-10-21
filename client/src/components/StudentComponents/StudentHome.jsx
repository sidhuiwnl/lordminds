import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const StudentHome = () => {
  const [assignmentData, setAssignmentData] = useState([]);
  const [topics, setTopics] = useState([]);

  // ✅ Fetch user details (to get college_id & department_id)
  async function getUserDetails() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.user_id) {
        console.error("User not found in localStorage");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/${user.user_id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch user details");

      const data = await response.json();
      const userData = data.data;

      if (userData.college_id && userData.department_id) {
        await fetchAssignments(userData.college_id, userData.department_id);
        await fetchTopics(userData.college_id, userData.department_id);
      } else {
        console.error("Missing college_id or department_id for user");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }

  // ✅ Fetch assignments
  async function fetchAssignments(college_id, department_id) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/colleges/${college_id}/departments/${department_id}/assignments`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) throw new Error("Failed to fetch assignments");

      const data = await response.json();
      setAssignmentData(data.data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }

  // ✅ Fetch topics dynamically
  async function fetchTopics(college_id, department_id) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/colleges/${college_id}/departments/${department_id}/topics`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) throw new Error("Failed to fetch topics");

      const data = await response.json();

      // Map API response to UI-friendly format
      const formattedTopics = (data.data || []).map((topic) => ({
        id: topic.topic_id,
        title: topic.topic_name,
        status: "Not Started", // You can update status dynamically later
        icon: "📘",
        progress: 0, // Default progress
        score: 0,
        color: "gray",
        department: topic.department_name,
        college: topic.college_name,
      }));

      setTopics(formattedTopics);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  }

  useEffect(() => {
    getUserDetails();
  }, []);

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* ===================== ASSIGNMENTS SECTION ===================== */}
      <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4">
        Assignments
      </h2>

      {assignmentData.length === 0 ? (
        <p className="text-gray-500">No assignments found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {assignmentData.map((assignment) => (
            <div
              key={assignment.assignment_id}
              className={`bg-white rounded-2xl shadow-sm p-4 lg:p-6 ${
                assignment.is_submitted ? "opacity-80" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-base lg:text-lg text-gray-800">
                  {assignment.assignment_topic}
                </h3>
                <span
                  className={`text-xs lg:text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
                    assignment.is_submitted
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {assignment.is_submitted ? "✅ Submitted" : "🕒 Pending"}
                </span>
              </div>
              <p className="text-xs lg:text-sm text-gray-600 mb-1">
                {assignment.description}
              </p>
              <p className="text-xs text-gray-500 mb-4 lg:mb-6">
                Due: {new Date(assignment.end_date).toLocaleDateString()}
              </p>
              <button
                disabled={assignment.is_submitted}
                className={`w-full py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium transition-colors ${
                  assignment.is_submitted
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                }`}
              >
                {assignment.is_submitted ? "Submitted" : "Attend Now"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===================== TOPICS SECTION ===================== */}
      <div className="flex justify-between items-center mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-800">Topics</h2>
        <span className="text-gray-400 text-xs lg:text-base">...</span>
      </div>

      <div  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {topics.map((topic) => {
          const colorClasses = {
            green: "bg-green-500 border-green-400",
            orange: "bg-orange-500 border-orange-400",
            blue: "bg-blue-500 border-blue-400",
            yellow: "bg-yellow-500 border-yellow-400 text-gray-900",
            gray: "bg-gray-300 border-gray-200 text-gray-700",
          };
          const statusClasses = {
            green: "bg-green-100 text-green-800",
            orange: "bg-orange-100 text-orange-800",
            blue: "bg-blue-100 text-blue-800",
            yellow: "bg-yellow-100 text-yellow-800",
            gray: "bg-gray-100 text-gray-500",
          };
          const progressColor = colorClasses[topic.color] || colorClasses.gray;
          const statusColor = statusClasses[topic.color] || statusClasses.gray;
          const textColor = topic.color === "yellow" ? "text-gray-900" : "text-white";

          return (
            <Link
              to={`/student/${topic.id}/subtopics`}
              key={topic.id}
              className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3 lg:mb-4">
                <h3 className="font-bold text-sm lg:text-base text-gray-800">
                  {topic.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${statusColor}`}
                >
                  {topic.icon} {topic.status}
                </span>
              </div>

              <div className="text-xs text-gray-500 mb-2">
                Department: {topic.department} | College: {topic.college}
              </div>

              <div className="relative mb-3 lg:mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3 lg:h-4">
                  <div
                    className={`h-3 lg:h-4 rounded-full relative transition-all duration-300 ${progressColor}`}
                    style={{ width: `${topic.progress}%` }}
                  >
                    {topic.progress > 0 && (
                      <span
                        className={`absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-xs font-bold ${textColor}`}
                      >
                        {topic.progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs lg:text-sm text-gray-600 text-left">
                Progress: {topic.progress}% | Score: {topic.score}/100
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default StudentHome;
