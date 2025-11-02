// TeacherDuration.jsx
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

const TeacherDuration = () => {
  const [durationData, setDurationData] = useState([]);
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

  // Fetch total duration
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

  useEffect(() => {
    fetchTotalDuration();
  }, [selectedDepartment]);

  const getBarColor = (hours) => {
    if (hours < 2) return "#ef4444"; // red
    if (hours < 5) return "#f59e0b"; // yellow
    if (hours < 10) return "#3b82f6"; // blue
    if (hours < 15) return "#10b981"; // green
    return "#059669"; // darker green for >15
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

  // Duration chart
  const renderDuration = () => {
    if (!selectedDepartment || loading.data) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          {loading.data ? "Loading total duration..." : "Please select a department to view total duration."}
        </p>
      );
    }

    if (!durationData.length) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          No duration data available.
        </p>
      );
    }

    return (
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
    );
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {renderFilters()}
      {renderDuration()}
    </div>
  );
};

export default TeacherDuration;