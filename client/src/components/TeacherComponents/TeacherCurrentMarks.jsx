// TeacherCurrentMarks.jsx
import React, { useState, useEffect } from "react";

const TeacherCurrentMarks = () => {
  const [topicAverageData, setTopicAverageData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState({
    data: false,
    departments: false,
  });

  const [storedUser] = useState(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  });

  // Fetch teacher details and departments
  useEffect(() => {
    if (!storedUser || !storedUser.user_id) return;
    const fetchTeacherAndDepartments = async () => {
      setLoading((p) => ({ ...p, departments: true }));
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/teacher/teacher-details/${storedUser.user_id}`
        );
        const data = await res.json();
        if (data.status === "success") {
          const teacherData = data.data;
          const deptRes = await fetch(
            `${import.meta.env.VITE_BACKEND_API_URL}/colleges/${teacherData.college_id}/departments`
          );
          const deptData = await deptRes.json();
          if (deptData.status === "success") {
            setDepartments(deptData.data);
          }
        }
      } catch (error) {
        console.error("Error fetching teacher details or departments:", error);
      } finally {
        setLoading((p) => ({ ...p, departments: false }));
      }
    };

    fetchTeacherAndDepartments();
  }, [storedUser]);

  // Fetch topic averages
  const fetchTopicAverages = async () => {
    if (!selectedDepartment) {
      setTopicAverageData([]);
      return;
    }
    setLoading((p) => ({ ...p, data: true }));
    try {
      const url = `${import.meta.env.VITE_BACKEND_API_URL}/assignments/topic-averages/${selectedDepartment}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "success") {
        setTopicAverageData(data.data);
      }
    } catch (error) {
      console.error("Error fetching topic averages:", error);
    } finally {
      setLoading((p) => ({ ...p, data: false }));
    }
  };

  useEffect(() => {
    fetchTopicAverages();
  }, [selectedDepartment]);

  const getColor = (percent) => {
    if (percent >= 90) return "text-green-600 font-semibold";
    if (percent >= 75) return "text-blue-600 font-semibold";
    if (percent >= 60) return "text-orange-500 font-medium";
    return "text-red-600 font-medium";
  };

  // Filters section
  const renderFilters = () => (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Department
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          disabled={loading.departments || departments.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        >
          <option value="">
            {loading.departments
              ? "Loading departments..."
              : departments.length
              ? "Select Department"
              : "No departments found"}
          </option>
          {departments.map((dept) => (
            <option key={dept.department_id} value={dept.department_id}>
              {dept.department_name || dept.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // Current Marks table
  const renderCurrentMarks = () => {
    if (!selectedDepartment || loading.data) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          {loading.data ? "Loading current marks..." : "Please select a department to view current marks."}
        </p>
      );
    }

    if (!topicAverageData.length) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          No current marks available.
        </p>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden min-w-[900px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1b64a5] text-white text-sm">
                <th className="px-4 py-3 text-left border border-gray-400">
                  Students name in higher to lower score
                </th>
                {(() => {
                  const allTopics = [
                    ...new Set(
                      topicAverageData.flatMap((s) => s.topics.map((t) => t.topic_name))
                    ),
                  ];
                  return allTopics.map((topic, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left border border-gray-400"
                    >
                      {topic}
                    </th>
                  ));
                })()}
                <th className="px-4 py-3 text-left border border-gray-400">
                  Average 
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
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

                return rankedData.map((student, index) => (
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
                          className={`px-4 py-3 border border-gray-400 ${
                            t ? (t.average_percentage) : "text-gray-400"
                          }`}
                        >
                          {t ? `${t.average_percentage.toFixed(0)}` : "-"}
                        </td>
                      );
                    })}
                    <td
                      className={`px-4 py-3 border border-gray-400 ${
                        (student.average)
                      }`}
                    >
                      {student.average.toFixed(0)}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {renderFilters()}
      {renderCurrentMarks()}
    </div>
  );
};

export default TeacherCurrentMarks;