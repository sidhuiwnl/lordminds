import React, { useEffect, useState } from "react";

const CurrentMarks = () => {
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarks() {
      try {
        // 🧩 Get student info from localStorage
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const studentId = user?.user_id;

        if (!studentId) {
          console.error("Student ID not found in localStorage");
          setLoading(false);
          return;
        }

        // 🧩 Fetch topic-wise marks
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
  }, []);

  const totalMarksObtained = marksData.reduce(
    (sum, item) => sum + (item.total_marks_obtained || 0),
    0
  );

  const totalMarksPossible = marksData.reduce(
    (sum, item) => sum + (item.total_marks_possible || 0),
    0
  );

  const percentage =
    totalMarksPossible > 0
      ? ((totalMarksObtained / totalMarksPossible) * 100).toFixed(2)
      : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading marks...
      </div>
    );
  }

  if (marksData.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No marks data found.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4 lg:mb-6">
            Current Marks
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse min-w-[300px]">
              <thead>
                <tr className="bg-[#1b65a6] text-white">
                  <th className="border border-[#1b65a6] px-3 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tl-lg">
                    Topic
                  </th>
                  <th className="border border-[#1b65a6] px-3 lg:px-4 py-2 text-left text-xs lg:text-base">
                    Marks 
                  </th>
                 
                </tr>
              </thead>
              <tbody>
                {marksData.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="border border-gray-200 px-3 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">
                      {item.topic_name}
                    </td>
                    <td className="border border-gray-200 px-3 lg:px-4 py-2 text-xs lg:text-base text-gray-700">
                      {item.total_marks_obtained}
                    </td>
                    
                  </tr>
                ))}

                <tr className="font-bold bg-[#f8fafc]">
                  <td className="border border-gray-300 px-3 lg:px-4 py-2 text-xs lg:text-base">
                    Total Marks Obtained
                  </td>
                  <td
                    colSpan="2"
                    className="border border-gray-300 px-3 lg:px-4 py-2 text-xs lg:text-base"
                  >
                    {totalMarksObtained}  Marks
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentMarks;
