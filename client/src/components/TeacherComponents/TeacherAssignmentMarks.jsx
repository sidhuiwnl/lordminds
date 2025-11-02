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
    }
  };

  useEffect(() => {
    fetchAssignmentMarks();
  }, [selectedDepartment]);

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

  // Assignment Marks table
  const renderAssignmentMarks = () => {
    if (!selectedDepartment || loading.data) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          {loading.data ? "Loading assignment marks..." : "Please select a department to view assignment marks."}
        </p>
      );
    }

    if (!assignmentMarksData.length) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          No assignment marks available.
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

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {renderFilters()}
      {renderAssignmentMarks()}
    </div>
  );
};

export default TeacherAssignmentMarks;