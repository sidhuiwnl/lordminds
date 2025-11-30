// TeacherOverallResult.jsx
import React, { useState, useEffect } from "react";

const TeacherOverallResult = () => {
  const [overallData, setOverallData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState({
    data: false,
    departments: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search and pagination states
  const [studentSearch, setStudentSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Fetch overall report
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
      // Reset pagination and search when new data loads
      setCurrentPage(1);
      setStudentSearch("");
    }
  };

  useEffect(() => {
    fetchOverallReport();
  }, [selectedDepartment]);

  // Handle search input change for departments
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
    // Reset pagination and search when department changes
    setCurrentPage(1);
    setStudentSearch("");
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

  // Filter students based on search input
  const getFilteredStudents = () => {
    if (!overallData.length) return [];

    let filteredData = [...overallData];

    // Apply student search filter
    if (studentSearch.trim()) {
      const searchTerm = studentSearch.toLowerCase();
      filteredData = filteredData.filter(student =>
        student.student_name.toLowerCase().includes(searchTerm) ||
        student.full_name.toLowerCase().includes(searchTerm)
      );
    }

    return filteredData;
  };

  // Get current students for pagination
  const getCurrentStudents = () => {
    const filteredStudents = getFilteredStudents();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Calculate total pages
  const getTotalPages = () => {
    const filteredStudents = getFilteredStudents();
    return Math.ceil(filteredStudents.length / itemsPerPage);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getColor = (percent) => {
    if (percent >= 90) return "text-green-600 font-semibold";
    if (percent >= 75) return "text-blue-600 font-semibold";
    if (percent >= 60) return "text-orange-500 font-medium";
    return "text-red-600 font-medium";
  };

  // Render pagination controls
  const renderPagination = () => {
    const totalPages = getTotalPages();
    const filteredStudents = getFilteredStudents();
    
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{" "}
          {filteredStudents.length} students
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 text-sm rounded ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Filters section
  const renderFilters = () => (
    <div className="mb-6 p-4 bg-white rounded-lg  shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Students
          </label>
          <input
            type="text"
            placeholder="Search by student name..."
            value={studentSearch}
            onChange={(e) => {
              setStudentSearch(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            disabled={!selectedDepartment || loading.data}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />
        </div>
      </div>
    </div>
  );

  // Overall report table
  const renderOverall = () => {
    if (!selectedDepartment || loading.data) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          {loading.data ? "Loading overall reports..." : "Please select a department to view overall reports."}
        </p>
      );
    }

    const filteredStudents = getFilteredStudents();
    const currentStudents = getCurrentStudents();

    if (!filteredStudents.length) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          {studentSearch ? "No students found matching your search." : "No overall reports available."}
        </p>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden min-w-[1000px]">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Overall Reports</h2>
            <div className="text-sm text-gray-500">
              Sorted by average performance (highest to lowest)
            </div>
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
              {currentStudents.map((student, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <tr key={student.student_id || index} className="hover:bg-gray-50 text-sm">
                    <td className="px-4 py-3 font-medium text-gray-900 border border-gray-400">
                      {globalIndex}. {student.student_name} - {student.full_name}
                    </td>
                    <td className={`px-4 py-3 border border-gray-400 ${getColor(student.topic_average_percentage)}`}>
                      {student.topic_average_percentage}%
                    </td>
                    <td className={`px-4 py-3 border border-gray-400 ${getColor(student.assignment_percentage)}`}>
                      {student.assignment_percentage}%
                    </td>
                    <td className="px-4 py-3 border border-gray-400 text-gray-700">
                      {student.total_session_hours} hours
                    </td>
                    <td className="px-4 py-3 border border-gray-400 text-gray-700">
                      {student.last_login}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mt-20 mb-6">Overall Report</h1>
      {renderFilters()}
      {renderOverall()}
    </div>
  );
};

export default TeacherOverallResult;