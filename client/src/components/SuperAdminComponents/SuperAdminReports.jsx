import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SuperAdminReports = () => {
  const [selectedTab, setSelectedTab] = useState("current");
  const [assignmentMarksData, setAssignmentMarksData] = useState([]);
  const [topicAverageData, setTopicAverageData] = useState([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "current", label: "Current Marks" },
    { id: "assignment", label: "Assignment Marks" },
    { id: "duration", label: "Total Duration" },
    { id: "overall", label: "Overall Reports" },
  ];

  useEffect(() => {
    if (selectedTab === "assignment") fetchAssignmentMarks();
    else if (selectedTab === "current") fetchTopicAverages();
  }, [selectedTab]);

  // 🧾 Fetch Assignment Marks (total marks)
  const fetchAssignmentMarks = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/assignments/assignment-marks`
      );
      const data = await res.json();
      if (data.status === "success") {
        setAssignmentMarksData(data.data);
      }
    } catch (error) {
      console.error("Error fetching assignment marks:", error);
    } finally {
      setLoading(false);
    }
  };

  // 📘 Fetch Topic Averages (Current Marks)
  const fetchTopicAverages = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/assignments/topic-averages`
      );
      const data = await res.json();
      if (data.status === "success") {
        setTopicAverageData(data.data);
      }
    } catch (error) {
      console.error("Error fetching topic averages:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Color based on percentage
  const getColor = (percent) => {
    if (percent >= 90) return "text-green-600 font-semibold";
    if (percent >= 75) return "text-blue-600 font-semibold";
    if (percent >= 60) return "text-orange-500 font-medium";
    return "text-red-600 font-medium";
  };

  // 🟦 Render Current Marks (Topic Averages)
  const renderCurrentMarks = () => {
    if (loading) return <p>Loading current marks...</p>;
    if (!topicAverageData.length)
      return <p className="text-gray-600">No current marks available.</p>;

    const allTopics = [
      ...new Set(
        topicAverageData.flatMap((s) => s.topics.map((t) => t.topic_name))
      ),
    ];

    const rankedData = topicAverageData
      .map((s) => {
        const avg =
          s.topics.reduce((sum, t) => sum + t.average_percentage, 0) /
          s.topics.length;
        return { ...s, average: avg };
      })
      .sort((a, b) => b.average - a.average);

    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden min-w-[900px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1b64a5] text-white text-sm">
                <th className="px-4 py-3 text-left border border-gray-400">
                  Students name in higher to lower score
                </th>
                {allTopics.map((topic, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left border border-gray-400"
                  >
                    {topic}
                  </th>
                ))}
                <th className="px-4 py-3 text-left border border-gray-400">
                  Average %
                </th>
              </tr>
            </thead>

            <tbody>
              {rankedData.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3 font-medium text-gray-900 border border-gray-400">
                    {index + 1}. {student.student_name}
                  </td>
                  {allTopics.map((topic, i) => {
                    const t = student.topics.find(
                      (tp) => tp.topic_name === topic
                    );
                    return (
                      <td
                        key={i}
                        className={`px-4 py-3 border border-gray-400  ${t ? (t.average_percentage) : "text-gray-400"
                          }`}
                      >
                        {t ? `${t.average_percentage.toFixed(0)}%` : "-"}
                      </td>
                    );
                  })}
                  <td
                    className={`px-4 py-3 border border-gray-400  ${(
                      student.average
                    )}`}
                  >
                    {student.average.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 🧾 Render Assignment Marks (total)
  const renderAssignmentMarks = () => {
    if (loading) return <p>Loading assignment marks...</p>;
    if (!assignmentMarksData.length)
      return <p className="text-gray-600">No assignment marks available.</p>;

    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden min-w-[600px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1b64a5] text-white text-sm">
                <th className="px-4 py-3 text-left border border-gray-400">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left border border-gray-400">
                  Total Marks
                </th>
                
              </tr>
            </thead>
            <tbody>
              {assignmentMarksData.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50 text-sm">
                  <td className="px-4 py-3 font-medium text-gray-900 border border-gray-400">
                    {index + 1}. {student.student_name}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-gray-700">
                    {student.total_marks_obtained}
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (selectedTab === "current") return renderCurrentMarks();
    if (selectedTab === "assignment") return renderAssignmentMarks();
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Tabs */}
      <div className="flex justify-center gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] ${selectedTab === tab.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
              }`}
            onClick={() => setSelectedTab(tab.id)}
          >
            <input
              type="radio"
              id={tab.id}
              name="reportType"
              checked={selectedTab === tab.id}
              onChange={() => setSelectedTab(tab.id)}
              className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor={tab.id}
              className="text-xs lg:text-sm font-medium text-gray-700 cursor-pointer"
            >
              {tab.label}
            </label>
          </div>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};

export default SuperAdminReports;
