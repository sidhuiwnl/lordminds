import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const StudentHome = () => {
  const navigate = useNavigate();
  const [assignmentData, setAssignmentData] = useState([]);
  const [topics, setTopics] = useState([]);

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

    
  async function fetchAssignments(college_id, department_id) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/colleges/${college_id}/departments/${department_id}/assignments`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) throw new Error("Failed to fetch assignments");

      const data = await response.json();
      const assignments = data.data || [];

      // 🔓 Determine which assignment(s) are unlocked
      const processedAssignments = assignments.map((assignment, index, arr) => {
        const firstPendingIndex = arr.findIndex((a) => !a.is_submitted);
        const isUnlocked = index <= firstPendingIndex; // unlock submitted + first pending
        return { ...assignment, isUnlocked };
      });

      setAssignmentData(processedAssignments);
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

      console.log("The topic data",data.data)
      const formattedTopics = (data.data || []).map((topic) => ({
        id: topic.topic_id,
        title: topic.topic_name,
        status: "Not Started",
        icon: "📘",
        progress: topic.avg_progress_percent,
        score: topic.avg_score,
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

  // 🧱 Empty state
  const EmptyState = ({ title, message, icon = "📝" }) => (
    <div className="col-span-full bg-white rounded-2xl shadow-sm p-8 lg:p-10 flex flex-col items-center justify-center border border-gray-100">
      <div className="text-4xl lg:text-5xl mb-4">{icon}</div>
      <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 text-center">{message}</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* ===================== ASSIGNMENTS SECTION ===================== */}
      <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4">
        Assignments
      </h2>

      {assignmentData.length === 0 ? (
        <EmptyState
          title="No Assignments Yet"
          message="Assignments will appear here once your instructors assign them. Check back soon!"
          icon="📋"
        />
      ) : (
        <div className="overflow-x-auto mb-6 lg:mb-8">
          <div className="flex gap-4 lg:gap-6 min-w-min pb-4">
            {assignmentData.map((assignment) => (
              <div
                key={assignment.assignment_id}
                className={`min-w-[260px] lg:min-w-[500px] bg-white rounded-2xl shadow-sm p-4 lg:p-6 flex-shrink-0 transition-opacity ${
                  !assignment.isUnlocked ? "opacity-60" : ""
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
                        : assignment.isUnlocked
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {assignment.is_submitted
                      ? "✅ Submitted"
                      : assignment.isUnlocked
                      ? "🕒 Pending"
                      : "🔒 Locked"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-4 lg:mb-6">
                  Due: {new Date(assignment.end_date).toLocaleDateString()}
                </p>

                <button
                  onClick={() =>
                    navigate(`/student/assignment/${assignment.assignment_id}`)
                  }
                  disabled={!assignment.isUnlocked}
                  className={`w-full py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium transition-colors ${
                    assignment.is_submitted
                      ? "bg-green-100 text-green-800 cursor-not-allowed"
                      : assignment.isUnlocked
                      ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {assignment.is_submitted
                    ? "✅ Submitted"
                    : assignment.isUnlocked
                    ? "Attend Now"
                    : "🔒 Locked"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TOPICS SECTION ===================== */}
      <div className="flex justify-between items-center mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-800">Topics</h2>
        <span className="text-gray-400 text-xs lg:text-base">...</span>
      </div>

      {topics.length === 0 ? (
        <EmptyState
          title="No Topics Available"
          message="Topics will be added here as your course progresses. Stay tuned for updates!"
          icon="📚"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
            const progressColor =  colorClasses.yellow;
            const statusColor =  statusClasses.yellow;
            const textColor =
              topic.color === "yellow" ? "text-yellow-400" : "text-white";

            return (
              <Link
                to={`/student/${topic.id}/subtopics`}
                key={topic.id}
                className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-100 hover:shadow-md transition-shadow w-full h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4 flex-1">
                  <h3 className="font-bold text-xs sm:text-sm lg:text-base text-gray-800 line-clamp-2">
                    {topic.title}
                  </h3>
                  <span
                    className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium flex items-center gap-1 ${statusColor} flex-shrink-0`}
                  >
                    {topic.icon} {topic.status}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-1 sm:mb-2 lg:mb-4 flex-shrink-0">
                  <span className="block sm:inline">Dept: {topic.department}</span>
                  <span className="hidden sm:inline mx-1">|</span>
                  <span className="block sm:inline">College: {topic.college}</span>
                </div>

                <div className="relative mb-2 sm:mb-3 lg:mb-4 flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 lg:h-4">
                    <div
                      className={`h-2 sm:h-3 lg:h-4 rounded-full relative transition-all duration-300 ${progressColor}`}
                      style={{ width: `${topic.progress}%` }}
                    >
                      {topic.progress > 0 && (
                        <span
                          className={`absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold ${textColor} whitespace-nowrap`}
                        >
                          {topic.progress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs lg:text-sm text-gray-600 text-left mt-auto">
                  Progress: {topic.progress}% | Score: {topic.score}/100
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentHome;