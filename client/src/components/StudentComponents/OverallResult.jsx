import React, { useEffect, useState } from "react";

const OverallResult = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.user_id) {
          setUserId(parsed.user_id);
        } else {
          setError("User ID not found in localStorage.");
          setLoading(false);
        }
      } else {
        setError("No user data found in localStorage.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error reading user from localStorage:", err);
      setError("Failed to parse user data.");
      setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    if (!userId) return;

    const fetchOverallReport = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/users/overallreport/${userId}`
        );
        if (!res.ok) throw new Error("Failed to fetch overall report");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error(err);
        setError("Error fetching overall report");
      } finally {
        setLoading(false);
      }
    };

    fetchOverallReport();
  }, [userId]);

  
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">Loading overall results...</div>
    );
  }

  
  if (error) {
    return (
      <div className="p-6 text-center text-red-600">{error}</div>
    );
  }

  
  if (!data) {
    return (
      <div className="p-6 text-center text-gray-600">No data available.</div>
    );
  }

  // ✅ Render result table
  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4 lg:mb-6">
            Overall Results
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-[#1b65a6] rounded-lg overflow-hidden min-w-[400px]">
              <thead>
                <tr className="bg-[#1b65a6] text-white">
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tl-lg">Student Name</th>
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base">Topic Marks</th>
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base">Assignment Marks</th>
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base">Total Duration</th>
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tr-lg">Last Login</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">
                    {data.student_name}
                  </td>
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">
                    {data.total_subtopic_marks}
                  </td>
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">
                    {data.total_assignment_marks}
                  </td>
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">
                    {data.total_hours} hrs
                  </td>
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">
                    27/09/25 - 9:45 AM
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

export default OverallResult;
