import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const StudentHome = () => {
  const navigate = useNavigate();
  const [assignmentData, setAssignmentData] = useState([]);
  const [topics, setTopics] = useState([]);
  const [userData, setUserData] = useState(null);

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
      setUserData(userData);

      if (userData.college_id && userData.department_id) {
        await fetchAssignments(userData.college_id, userData.department_id, user.user_id);
        await fetchTopicsForStudent(user.user_id);
      } else {
        console.error("Missing college_id or department_id for user");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }

  async function fetchAssignments(college_id, department_id, student_id) {
    try {
      // ✅ Pass student_id as query parameter to get completion status
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/colleges/${college_id}/departments/${department_id}/assignments?student_id=${student_id}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) throw new Error("Failed to fetch assignments");

      const data = await response.json();
      console.log("Assignments API Response:", data); // Debug log
      const assignments = data.data || [];

      // ✅ Process assignments with proper status
      const processedAssignments = assignments.map((assignment, index, arr) => {
        const isCompleted = Boolean(assignment.test_completed);
        const isExpired = assignment.time_status === "expired";
        const isActive = assignment.time_status === "active";

        // Unlock logic
        let isUnlocked = false;
        if (index === 0) {
          isUnlocked = true;
        } else {
          const previous = arr[index - 1];
          const prevCompleted = previous.test_completed === 1 || previous.test_completed === true;
          const prevExpired = previous.time_status === "expired";
          isUnlocked = prevCompleted || prevExpired;
        }

        if (isExpired && isCompleted) {
          isUnlocked = true;
        }

        return {
          ...assignment,
          isUnlocked,
          isCompleted,
          isExpired,
          isActive,
        };
      });


      setAssignmentData(processedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  }

  async function requestMicPermission() {
  try {
    const status = await navigator.permissions.query({ name: "microphone" });

    if (status.state === "granted") {
      return true; // Already granted
    }

    if (status.state === "denied") {
      toast.error("Microphone is blocked. Enable it from the browser lock icon.");
      return false;
    }

    // State is "prompt" → this triggers REAL browser permission popup
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;

  } catch (err) {
    console.error("Mic permission denied:", err);
    return false;
  }
}



  // ✅ Fetch topics dynamically
  async function fetchTopicsForStudent(student_id) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/${student_id}/topics-progress`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) throw new Error("Failed to fetch topics");

      const data = await response.json();

      console.log("Student topic progress data", data.data);

      const formattedTopics = (data.data || []).map((topic) => {
        let status = "Not Started";

        const progress = topic.progress_percent ?? 0;
        const score = topic.average_score ?? 0;

        if (progress > 0 && progress < 100) {
          status = "In Progress";
        } else if (progress === 100) {
          status = "Completed";
        }

        return {
          id: topic.topic_id,
          title: topic.topic_name,
          status: status,
          icon: "📘",
          progress: progress,
          score: score,
          color: "yellow",
          department: topic.department_name,
          college: topic.college_name,
        };
      });


      setTopics(formattedTopics);

    } catch (error) {
      console.error("Error fetching student topics:", error);
    }
  }


  useEffect(() => {
    getUserDetails();
  }, []);


  const getAssignmentButtonConfig = (assignment) => {
    // ⭐ If test completed → show view test
    if (assignment.isCompleted) {
      return {
        text: "📘 View Test",
        className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        disabled: false,
        action: () => navigate(`/student/assignment/${assignment.assignment_id}/view-test`)
      };
    }

    // ❌ Expired without completion
    if (assignment.isExpired) {
      return {
        text: "🔴 Time Expired",
        className: "bg-red-100 text-red-800 cursor-not-allowed",
        disabled: true
      };
    }

    // 🟡 Start normally
    if (assignment.isActive && assignment.isUnlocked) {
      return {
        text: "Start Assignment",
        className: "bg-yellow-400 text-gray-900 hover:bg-yellow-500",
        disabled: false,
        action: async () => {
          const ok = await requestMicPermission();
          if (!ok) {
            toast("Microphone permission is required to start the assignment test.");
            return;
          }
          navigate(`/student/assignment/${assignment.assignment_id}`);
        }
      };
    }

    // 🔒 Locked
    return {
      text: "🔒 Locked",
      className: "bg-gray-200 text-gray-500 cursor-not-allowed",
      disabled: true
    };
  };



  const getStatusBadgeConfig = (assignment) => {
    if (assignment.isCompleted) {
      return { text: "✅ Completed", className: "bg-green-100 text-green-800" };
    }
    if (assignment.isExpired) {
      return { text: "🔴 Expired", className: "bg-red-100 text-red-800" };
    }
    if (assignment.isActive && assignment.isUnlocked) {
      return { text: "🕒 Pending", className: "bg-yellow-100 text-yellow-800" };
    }
    return { text: "🔒 Locked", className: "bg-gray-100 text-gray-500" };
  };





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
      <ToastContainer />

      {assignmentData.length === 0 ? (
        <EmptyState
          title="No Assignments Yet"
          message="Assignments will appear here once your instructors assign them. Check back soon!"
          icon="📋"
        />
      ) : (
        <div className="overflow-x-auto mb-6 lg:mb-8">
          <div className="flex gap-4 lg:gap-6 min-w-min pb-4">
            {assignmentData.map((assignment) => {
              const buttonConfig = getAssignmentButtonConfig(assignment);
              const badgeConfig = getStatusBadgeConfig(assignment);

              return (
                <div
                  key={assignment.assignment_id}
                  className={`min-w-[260px] lg:min-w-[500px] bg-white rounded-2xl shadow-sm p-4 lg:p-6 flex-shrink-0 flex flex-col justify-between transition-opacity ${!assignment.isUnlocked && !assignment.hasSubmitted ? "opacity-60" : ""
                    }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-base lg:text-lg text-gray-800">
                      {assignment.assignment_topic}
                    </h3>
                    <span
                      className={`text-xs lg:text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-full ${badgeConfig.className}`}
                    >
                      {badgeConfig.text}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>

                    {assignment.end_date ? (
                      new Date(assignment.end_date).toLocaleDateString()
                    ) : (
                      <span className="text-emerald-600 font-medium">No Due Date • Ongoing</span>
                    )}
                  </p>

                  {assignment.student_marks_obtained !== null && (
                    <p className="text-xs text-green-600 mb-2">
                      Score: {assignment.student_marks_obtained}
                    </p>
                  )}


                  <p className="text-xs text-gray-500 mb-4 lg:mb-6">
                    Status: {assignment.time_status} • Submissions: {assignment.total_submissions}
                  </p>

                  <button
                    onClick={buttonConfig.action}
                    disabled={buttonConfig.disabled}
                    className={`w-full py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium transition-colors ${buttonConfig.className}`}
                  >
                    {buttonConfig.text}
                  </button>
                </div>
              );
            })}
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
            const progressColor = colorClasses.yellow;
            const statusColor = statusClasses.yellow;
            const textColor = topic.color === "yellow" ? "text-yellow-400" : "text-white";

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