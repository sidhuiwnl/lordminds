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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
      setCurrentPage(1);
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
      } else {
        setDurationData([]);
      }
    } catch (error) {
      console.error("Error fetching total duration:", error);
      setDurationData([]);
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
    setCurrentPage(1);
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
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
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
                    className={`p-2 cursor-pointer hover:bg-blue-100 text-sm ${selectedDepartment === dept.department_id ? "bg-blue-50" : ""
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
    if (!selectedDepartment) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">Please select a department to view total duration.</p>
        </div>
      );
    }

    if (loading.data) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading duration data...</span>
          </div>
        </div>
      );
    }

    if (!durationData.length) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-lg">No duration data available for this department.</p>
        </div>
      );
    }

    // Sort by duration (same as before)
    const sortedData = [...durationData].sort((a, b) => b.total_duration_hours - a.total_duration_hours);

    // Pagination logic
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentData = sortedData.slice(startIdx, endIdx);

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Total Duration</h2>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} • Showing {startIdx + 1}–{Math.min(endIdx, sortedData.length)} of {sortedData.length}
          </div>
        </div>

        {/* Chart - Reduced height to make room for pagination */}
        <div className="relative h-64 mb-6">
          <Bar
            data={{
              labels: currentData.map((d, i) => `${startIdx + i + 1}. ${d.student_name} - ${d.full_name}`),
              datasets: [
                {
                  label: "Total Hours",
                  data: currentData.map((d) => d.total_duration_hours),
                  backgroundColor: currentData.map((d) => getBarColor(d.total_duration_hours)),
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context) => `Total: ${context.parsed.x.toFixed(2)} hours`
                  }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  max: Math.max(...sortedData.map(d => d.total_duration_hours)) + 2 || 20,
                  title: { display: true, text: "Total Hours" },
                },
                y: {
                  ticks: {
                    maxRotation: 0,
                    minRotation: 0,
                    font: {
                      size: 12
                    }
                  },
                },
              },
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(239, 68, 68, 0.8)" }}></div>
            <span className="text-xs text-gray-600">Less than 2 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(249, 115, 22, 0.8)" }}></div>
            <span className="text-xs text-gray-600">Less than 4 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(234, 179, 8, 0.8)" }}></div>
            <span className="text-xs text-gray-600">Less than 6 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(59, 130, 246, 0.8)" }}></div>
            <span className="text-xs text-gray-600">Less than 10 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(34, 197, 94, 0.8)" }}></div>
            <span className="text-xs text-gray-600">10+ hours</span>
          </div>
        </div>

        {/* Pagination Controls - Always show when there's data */}
        <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-5 py-2 rounded-lg font-medium transition-colors duration-200 ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
            }`}
          >
            ← Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors duration-200 ${
                  currentPage === page
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-5 py-2 rounded-lg font-medium transition-colors duration-200 ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
            }`}
          >
            Next →
          </button>
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