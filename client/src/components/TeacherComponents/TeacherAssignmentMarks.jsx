// TeacherAssignmentMarks.jsx
import React, { useState, useEffect, useRef } from "react";

const TeacherAssignmentMarks = () => {
  const [assignmentMarksData, setAssignmentMarksData] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]); // Added
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showDropdown, setShowDropdown] = useState(false); // Added
  const [loading, setLoading] = useState({
    data: false,
    departments: false,
  });

  // Search and pagination states
  const [studentSearch, setStudentSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const dropdownRef = useRef(null); // For clicking outside

  const [storedUser] = useState(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            setFilteredDepartments(deptData.data); // Initialize filtered list
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

  // Fetch assignment marks when department changes
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
      setCurrentPage(1);
      setStudentSearch("");
    }
  };

  useEffect(() => {
    fetchAssignmentMarks();
  }, [selectedDepartment]);

  // Handle department search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchInput(query);

    if (query.trim() === "") {
      setFilteredDepartments(departments);
    } else {
      const filtered = departments.filter((dept) =>
        dept.department_name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDepartments(filtered);
    }
    setShowDropdown(true);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  // Handle department selection
  const handleDepartmentSelect = (dept) => {
    setSelectedDepartment(dept.department_id);
    setSearchInput(dept.department_name);
    setShowDropdown(false);
  };

  // Clear selection
  const clearDepartment = () => {
    setSelectedDepartment("");
    setSearchInput("");
    setFilteredDepartments(departments);
  };

  // Filter students
  const getFilteredStudents = () => {
    if (!assignmentMarksData.length) return [];

    let filteredData = [...assignmentMarksData];

    if (studentSearch.trim()) {
      const searchTerm = studentSearch.toLowerCase();
      filteredData = filteredData.filter(
        (student) =>
          student.student_name?.toLowerCase().includes(searchTerm) ||
          student.full_name?.toLowerCase().includes(searchTerm)
      );
    }

    return filteredData;
  };

  const getCurrentStudents = () => {
    const filteredStudents = getFilteredStudents();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredStudents().length / itemsPerPage);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    const totalPages = getTotalPages();
    const filteredStudents = getFilteredStudents();

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
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
                currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
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

  const renderFilters = () => (
    <div className="mb-6 p-4 bg-white rounded-lg  shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Department
          </label>
          <div className="relative">
            <div className="flex">
              <input
                type="text"
                placeholder={loading.departments ? "Loading departments..." : "Search departments..."}
                value={searchInput}
                onChange={handleSearchChange}
                onFocus={handleInputFocus}
                disabled={loading.departments || departments.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
              />
              {selectedDepartment && (
                <button
                  onClick={clearDepartment}
                  className="px-3 py-2 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-300 text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && departments.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept) => (
                    <div
                      key={dept.department_id}
                      onClick={() => handleDepartmentSelect(dept)}
                      className={`p-3 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0 ${
                        selectedDepartment === dept.department_id ? "bg-blue-100 font-medium" : ""
                      }`}
                    >
                      {dept.department_name}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-sm text-center">No departments found</div>
                )}
              </div>
            )}
          </div>

          {selectedDepartment && (
            <p className="mt-2 text-sm text-blue-600">
              Selected: {
                departments.find(d => d.department_id === selectedDepartment)?.department_name
              }
            </p>
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
              setCurrentPage(1);
            }}
            disabled={!selectedDepartment || loading.data}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
          />
        </div>
      </div>
    </div>
  );

  const renderAssignmentMarks = () => {
    if (!selectedDepartment || loading.data) {
      return (
        <p className="text-gray-600 bg-white p-8 rounded-lg shadow text-center text-lg">
          {loading.data ? "Loading assignment marks..." : "Please select a department to view assignment marks."}
        </p>
      );
    }

    const filteredStudents = getFilteredStudents();
    const currentStudents = getCurrentStudents();

    if (!filteredStudents.length) {
      return (
        <p className="text-gray-600 bg-white p-8 rounded-lg shadow text-center">
          {studentSearch ? "No students found matching your search." : "No assignment marks available for this department."}
        </p>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1b64a5] text-white text-sm">
                <th className="px-6 py-4 text-left border border-gray-300">Student Name</th>
                <th className="px-6 py-4 text-left border border-gray-300">Total Marks</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((student, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <tr key={student.student_id} className="hover:bg-gray-50 text-sm">
                    <td className="px-6 py-4 font-medium text-gray-900 border border-gray-300">
                      {globalIndex}. {student.student_name} - {student.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-700 border border-gray-300">
                      {student.total_marks_obtained ?? "-"}
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
    <div className="p-4 lg:p-8 bg-gray-50 mt-10 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Assignment Marks</h1>
      {renderFilters()}
      {renderAssignmentMarks()}
    </div>
  );
};

export default TeacherAssignmentMarks;