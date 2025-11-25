import React, { useEffect, useState } from "react";

const CurrentMarks = () => {
  const [marksData, setMarksData] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);

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

    async function fetchMarks() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/users/topicwise/testmarks/${studentId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch topic-wise marks");
        }

        const data = await response.json();

        if (data.status === "success") {
          setMarksData(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching marks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarks();
  }, [studentId]);

  const totalMarksObtained = marksData.reduce(
    (sum, item) => sum + (item.total_marks_obtained || 0),
    0
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 mt-30 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6]">
        <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-6">
          Current Marks
        </h2>

        {!studentId ? (
          <p className="text-gray-600 text-sm">No student ID found.</p>
        ) : marksData.length === 0 ? (
          <p className="text-gray-600 text-sm">No marks data available.</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full border border-[#1b65a6] rounded-lg text-sm text-left text-gray-700">
              <thead className="bg-[#1b65a6] text-white">
                <tr>
                  <th className="px-6 py-3 border-r border-white w-1/2">
                    Topic
                  </th>
                  <th className="px-6 py-3 border-r border-white w-1/2">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody>
                {marksData.map((item, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 border-r border-gray-200 font-medium">
                      {item.topic_name}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-800">
                      {item.total_marks_obtained || 0} 
                    </td>
                  </tr>
                ))}

                {/* Total Marks Row */}
                <tr className="border-t border-gray-300 bg-gray-50 font-semibold">
                  <td className="px-6 py-3 border-r border-gray-200">
                    Total Marks Obtained
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {totalMarksObtained} Marks
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentMarks;
