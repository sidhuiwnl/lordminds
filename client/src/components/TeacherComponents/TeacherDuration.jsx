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
  const [searchInput, setSearchInput] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

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
            setFilteredDepartments(deptData.data);
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

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    
    if (query === "") {
      setFilteredDepartments(departments);
    } else {
      const filtered = departments.filter((dept) =>
        dept.department_name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDepartments(filtered);
    }
  };

  // Handle department selection
  const handleDepartmentSelect = (dept) => {
    setSelectedDepartment(dept.department_id);
    setSearchInput(dept.department_name);
    setShowDropdown(false);
    setFilteredDepartments(departments);
  };

  // Clear search and reset when input is focused
  const handleInputFocus = () => {
    setShowDropdown(true);
    if (selectedDepartment) {
      setSearchInput("");
      setFilteredDepartments(departments);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.department-dropdown')) {
        setShowDropdown(false);
        // Restore selected department name if user clicks away without selecting
        if (selectedDepartment) {
          const selectedDeptName = departments.find(d => d.department_id === selectedDepartment)?.department_name || "";
          setSearchInput(selectedDeptName);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedDepartment, departments]);

  const getBarColor = (hours) => {
    if (hours < 2) return "rgba(239, 68, 68, 0.8)"; // 🔴 red
    if (hours < 4) return "rgba(249, 115, 22, 0.8)"; // 🟠 orange
    if (hours < 6) return "rgba(234, 179, 8, 0.8)";  // 🟡 yellow
    if (hours < 10) return "rgba(59, 130, 246, 0.8)"; // 🔵 blue
    return "rgba(34, 197, 94, 0.8)"; // 🟢 green
  };

  // Filters section
  const renderFilters = () => (
    <div className="mb-6 p-4 bg-white rounded-lg mt-30 shadow-sm border border-gray-200">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Department
        </label>
        <div className="relative department-dropdown">
          <input
            type="text"
            placeholder={loading.departments ? "Loading departments..." : "Search departments..."}
            value={searchInput}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            disabled={loading.departments || departments.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((dept) => (
                  <div
                    key={dept.department_id}
                    onClick={() => handleDepartmentSelect(dept)}
                    className={`p-2 cursor-pointer hover:bg-blue-100 text-sm ${
                      selectedDepartment === dept.department_id ? "bg-blue-50" : ""
                    }`}
                  >
                    {dept.department_name}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500 text-sm">No departments found.</div>
              )}
            </div>
          )}
        </div>
        {departments.length === 0 && !loading.departments && (
          <p className="text-red-500 text-xs mt-1">No departments available</p>
        )}
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
              labels: durationData.map((d, i) => `${i + 1}. ${d.student_name} - ${d.full_name}`),
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
        {/* Updated Custom Legend to match new color ranges */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" style={{backgroundColor: "rgba(239, 68, 68, 0.8)"}}></div>
            <span className="text-xs text-gray-600">Less than 2 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{backgroundColor: "rgba(249, 115, 22, 0.8)"}}></div>
            <span className="text-xs text-gray-600">Less than 4 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{backgroundColor: "rgba(234, 179, 8, 0.8)"}}></div>
            <span className="text-xs text-gray-600">Less than 6 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" style={{backgroundColor: "rgba(59, 130, 246, 0.8)"}}></div>
            <span className="text-xs text-gray-600">Less than 10 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" style={{backgroundColor: "rgba(34, 197, 94, 0.8)"}}></div>
            <span className="text-xs text-gray-600">10+ hours</span>
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