// TeacherAssignmentMarks.jsx
import React, { useState, useEffect } from "react";

const TeacherAssignmentMarks = () => {
  const [assignmentMarksData, setAssignmentMarksData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState({
    data: false,
    departments: false,
  });

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

  // Fetch assignment marks
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
      // Reset pagination and search when new data loads
      setCurrentPage(1);
      setStudentSearch("");
    }
  };

  useEffect(() => {
    fetchAssignmentMarks();
  }, [selectedDepartment]);

  // Filter students based on search input
  const getFilteredStudents = () => {
    if (!assignmentMarksData.length) return [];

    let filteredData = [...assignmentMarksData];

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
    <div className="mb-6 p-4 bg-white rounded-lg mt-30 shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1);
              setStudentSearch("");
            }}
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

  // Assignment Marks table
  const renderAssignmentMarks = () => {
    if (!selectedDepartment || loading.data) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          {loading.data ? "Loading assignment marks..." : "Please select a department to view assignment marks."}
        </p>
      );
    }

    const filteredStudents = getFilteredStudents();
    const currentStudents = getCurrentStudents();

    if (!filteredStudents.length) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          {studentSearch ? "No students found matching your search." : "No assignment marks available."}
        </p>
      );
    }

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
              {currentStudents.map((student, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <tr key={student.student_id || index} className="hover:bg-gray-50 text-sm">
                    <td className="px-4 py-3 font-medium text-gray-900 border border-gray-400">
                      {globalIndex}. {student.student_name} - {student.full_name}
                    </td>
                    <td className="px-4 py-3 border border-gray-400 text-gray-700">
                      {student.total_marks_obtained}
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
      {renderFilters()}
      {renderAssignmentMarks()}
    </div>
  );
};

export default TeacherAssignmentMarks;