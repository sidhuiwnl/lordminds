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

const TeacherReports = () => {
  const [selectedTab, setSelectedTab] = useState("current");
  const [assignmentMarksData, setAssignmentMarksData] = useState([]);
  const [topicAverageData, setTopicAverageData] = useState([]);
  const [durationData, setDurationData] = useState([]);
  const [overallData, setOverallData] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState({
    data: false,
    colleges: false,
    departments: false,
  });

  const tabs = [
    { id: "current", label: "Current Marks" },
    { id: "assignment", label: "Assignment Marks" },
    { id: "duration", label: "Total Duration" },
    { id: "overall", label: "Overall Reports" },
  ];

  console.log("Selected College:", selectedCollege);
  console.log("Selected Department:", selectedDepartment);

  const fetchColleges = async () => {
    setLoading((p) => ({ ...p, colleges: true }));
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/colleges/get-all`);
      const data = await res.json();
      if (data.status === "success") {
        setColleges(data.data);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setLoading((p) => ({ ...p, colleges: false }));
    }
  };


  const fetchDepartments = async () => {
    if (!selectedCollege) {
      setDepartments([]);
      setSelectedDepartment("");
      return;
    }
    setLoading((p) => ({ ...p, departments: true }));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/colleges/${selectedCollege}/departments`
      );
      const data = await res.json();
      if (data.status === "success") {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading((p) => ({ ...p, departments: false }));
    }
  };


  const fetchAssignmentMarks = async () => {
    if (!selectedDepartment) {
      setAssignmentMarksData([]);
      return;
    }
    setLoading((p) => ({ ...p, data: true }));
    try {
      const url = `${import.meta.env.VITE_BACKEND_API_URL}/assignments/assignment-marks/${selectedDepartment}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "success") {
        setAssignmentMarksData(data.data);
      }
    } catch (error) {
      console.error("Error fetching assignment marks:", error);
    } finally {
      setLoading((p) => ({ ...p, data: false }));
    }
  };


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

  const fetchTotalDuration = async () => {
    if (!selectedDepartment) {
      setDurationData([]);
      return;
    }
    setLoading((p) => ({ ...p, data: true }));
    try {
      const url = `${import.meta.env.VITE_BACKEND_API_URL}/assignments/total-duration/${selectedDepartment}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "success") {
        // Sort by total_duration_hours descending
        const sortedData = data.data.sort((a, b) => b.total_duration_hours - a.total_duration_hours);
        setDurationData(sortedData);
      }
    } catch (error) {
      console.error("Error fetching total duration:", error);
    } finally {
      setLoading((p) => ({ ...p, data: false }));
    }
  };

  const fetchOverallReport = async () => {
    if (!selectedDepartment) {
      setOverallData([]);
      return;
    }
    setLoading((p) => ({ ...p, data: true }));
    try {
      const url = `${import.meta.env.VITE_BACKEND_API_URL}/assignments/overall-report/${selectedDepartment}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "success") {
        // Sort by average of assignment_percentage and topic_average_percentage descending
        const sortedData = data.data.sort((a, b) => {
          const avgA = (a.assignment_percentage + a.topic_average_percentage) / 2;
          const avgB = (b.assignment_percentage + b.topic_average_percentage) / 2;
          return avgB - avgA;
        });
        setOverallData(sortedData);
      }
    } catch (error) {
      console.error("Error fetching overall report:", error);
    } finally {
      setLoading((p) => ({ ...p, data: false }));
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [selectedCollege]);

  useEffect(() => {
    if (selectedTab === "assignment") {
      fetchAssignmentMarks();
    } else if (selectedTab === "current") {
      fetchTopicAverages();
    } else if (selectedTab === "duration") {
      fetchTotalDuration();
    } else if (selectedTab === "overall") {
      fetchOverallReport();
    }
  }, [selectedTab, selectedCollege, selectedDepartment]);

  
  const getColor = (percent) => {
    if (percent >= 90) return "text-green-600 font-semibold";
    if (percent >= 75) return "text-blue-600 font-semibold";
    if (percent >= 60) return "text-orange-500 font-medium";
    return "text-red-600 font-medium";
  };

  const getBarColor = (hours) => {
    if (hours < 2) return "#ef4444"; // red
    if (hours < 5) return "#f59e0b"; // yellow
    if (hours < 10) return "#3b82f6"; // blue
    if (hours < 15) return "#10b981"; // green
    return "#059669"; // darker green for >15
  };

  
  const renderFilters = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select College
        </label>
        <select
          value={selectedCollege}
          onChange={(e) => {
            setSelectedCollege(e.target.value);
            setSelectedDepartment("");
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          disabled={loading.colleges}
        >
          <option value="">All Colleges</option>
          {colleges.map((college) => (
            <option key={college.id} value={college.college_id}>
              {college.name || college.college_name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Department
        </label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          disabled={!selectedCollege || loading.departments}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.department_id}>
              {dept.name || dept.department_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // 🟦 Render Current Marks (Topic Averages)
  const renderCurrentMarks = () => {
    return (
      <div>
        {renderFilters()}
        {(!selectedDepartment || loading.data) ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            {loading.data ? "Loading current marks..." : "Please select a department to view current marks."}
          </p>
        ) : !topicAverageData.length ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            No current marks available.
          </p>
        ) : (
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
                      Average %
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
        )}
      </div>
    );
  };

  // 🧾 Render Assignment Marks (total)
  const renderAssignmentMarks = () => {
    return (
      <div>
        {renderFilters()}
        {(!selectedDepartment || loading.data) ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            {loading.data ? "Loading assignment marks..." : "Please select a department to view assignment marks."}
          </p>
        ) : !assignmentMarksData.length ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            No assignment marks available.
          </p>
        ) : (
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
        )}
      </div>
    );
  };

  // Render Total Duration
  const renderDuration = () => {
    return (
      <div>
        {renderFilters()}
        {(!selectedDepartment || loading.data) ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            {loading.data ? "Loading total duration..." : "Please select a department to view total duration."}
          </p>
        ) : !durationData.length ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            No duration data available.
          </p>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Total Duration</h2>
            </div>
            <div className="relative h-96">
              <Bar
                data={{
                  labels: durationData.map((d, i) => `${i + 1}. ${d.student_name}`),
                  datasets: [
                    {
                      label: "Total Hours",
                      data: durationData.map((d) => d.total_duration_hours),
                      backgroundColor: durationData.map((d) => getBarColor(d.total_duration_hours)),
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      max: Math.max(...durationData.map(d => d.total_duration_hours)) + 2 || 20,
                      title: {
                        display: true,
                        text: "Total Hours",
                      },
                    },
                    y: {
                      ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                      },
                    },
                  },
                }}
              />
            </div>
            {/* Custom Legend */}
            <div className="flex justify-around mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-600">Less than 2 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-xs text-gray-600">Less than 5 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">Less than 10 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Less than 15 hours</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Overall Reports
  const renderOverall = () => {
    return (
      <div>
        {renderFilters()}
        {(!selectedDepartment || loading.data) ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            {loading.data ? "Loading overall reports..." : "Please select a department to view overall reports."}
          </p>
        ) : !overallData.length ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            No overall reports available.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden min-w-[1000px]">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Overall Reports</h2>
                
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1b64a5] text-white text-sm">
                    <th className="px-4 py-3 text-left border border-gray-400">Student Name</th>
                    <th className="px-4 py-3 text-left border border-gray-400">Current Marks</th>
                    <th className="px-4 py-3 text-left border border-gray-400">Assignment Marks</th>
                    <th className="px-4 py-3 text-left border border-gray-400">Total Duration</th>
                    <th className="px-4 py-3 text-left border border-gray-400">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {overallData.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 text-sm">
                      <td className="px-4 py-3 font-medium text-gray-900 border border-gray-400">
                        {index + 1}. {student.student_name}
                      </td>
                      <td className={`px-4 py-3 border border-gray-400 ${(student.topic_average_percentage)}`}>
                        {student.topic_average_percentage}
                      </td>
                      <td className={`px-4 py-3 border border-gray-400 ${(student.assignment_percentage)}`}>
                        {student.assignment_percentage}
                      </td>
                      <td className="px-4 py-3 border border-gray-400 text-gray-700">
                        {student.total_session_hours} hours
                      </td>
                      <td className="px-4 py-3 border border-gray-400 text-gray-700">
                        12/9 - 5:25 PM
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (selectedTab === "current") return renderCurrentMarks();
    if (selectedTab === "assignment") return renderAssignmentMarks();
    if (selectedTab === "duration") return renderDuration();
    if (selectedTab === "overall") return renderOverall();
    return null;
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Tabs */}
      <div className="flex justify-center gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] ${
              selectedTab === tab.id
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

export default TeacherReports;