import React, { useEffect, useState } from "react";

const AssignmentMarks = () => {
  const [assignments, setAssignments] = useState([]);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setStudentId(parsed.user_id);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!studentId) return;

    const fetchMarks = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/users/assignmentmarks/${studentId}`
        );
        const data = await res.json();
        if (data.status === "success") {
          setAssignments(data.data);
        }
      } catch (err) {
        console.error("Error fetching assignment marks:", err);
      }
    };

    fetchMarks();
  }, [studentId]);

  // ⭐ Convert marks → stars
  const getStars = (marksObtained, maxMarks) => {
    const ratio = (marksObtained / maxMarks) * 100;
    if (ratio >= 90) return { stars: "★★★★★", color: "text-green-500" };
    if (ratio >= 75) return { stars: "★★★★", color: "text-blue-500" };
    if (ratio >= 50) return { stars: "★★★", color: "text-orange-500" };
    if (ratio >= 30) return { stars: "★★", color: "text-yellow-500" };
    return { stars: "★", color: "text-red-500" };
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6]">
        <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-6">
          Assignment Marks
        </h2>

        {!studentId ? (
          <p className="text-gray-600 text-sm">No student ID found.</p>
        ) : assignments.length === 0 ? (
          <p className="text-gray-600 text-sm">No assignment marks available.</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full border border-[#1b65a6] rounded-lg text-sm text-left text-gray-700">
              <thead className="bg-[#1b65a6] text-white">
                <tr>
                  <th className="px-6 py-3 border-r border-white w-1/2">Assignment</th>
                  <th className="px-6 py-3 border-r border-white w-1/2">Stars</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => {
                  const { stars, color } = getStars(a.marks_obtained, a.max_marks);
                  return (
                    <tr
                      key={i}
                      className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3 border-r border-gray-200 font-medium">
                        {a.assignment_topic}
                      </td>
                      <td className="px-6 py-3 ">
                        <span
                          className={`${color} cursor-default font-semibold tracking-wider`}
                          title={`${a.marks_obtained}/${a.max_marks} marks`}
                        >
                          {stars}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentMarks;
