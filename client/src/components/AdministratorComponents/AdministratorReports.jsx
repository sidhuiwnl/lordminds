import React, { useState, useEffect } from "react";

const AdministratorReports = () => {
  const [overallData, setOverallData] = useState([]);
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

  // Fetch administrator details and departments
  useEffect(() => {
    if (!storedUser || !storedUser.user_id) return;
    const fetchAdministratorDetails = async () => {
      setLoading((p) => ({ ...p, departments: true }));
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/administrator/get-administrator-details/${storedUser.user_id}`
        );
        const data = await res.json();
        if (data.status === "success") {
          setDepartments(data.data.departments || []);
        }
      } catch (error) {
        console.error("Error fetching administrator details:", error);
      } finally {
        setLoading((p) => ({ ...p, departments: false }));
      }
    };

    fetchAdministratorDetails();
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
        // Sort by assignment percentage
        const sortedData = data.data.sort(
          (a, b) => b.assignment_percentage - a.assignment_percentage
        );
        setOverallData(sortedData);
      }
    } catch (error) {
      console.error("Error fetching overall report:", error);
    } finally {
      setLoading((p) => ({ ...p, data: false }));
    }
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
              {dept.department_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // Overall report table
  const renderOverallReport = () => {
    if (!selectedDepartment || loading.data) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          {loading.data ? "Loading overall reports..." : "Please select a department to view reports."}
        </p>
      );
    }

    if (!overallData.length) {
      return (
        <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
          No overall reports available.
        </p>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden min-w-[900px]">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Overall Reports</h2>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#1b64a5] text-white">
                <th className="px-4 py-3 text-left border border-gray-400">S.NO</th>
                <th className="px-4 py-3 text-left border border-gray-400">Student Name</th>
                <th className="px-4 py-3 text-left border border-gray-400">Current Marks</th>
                <th className="px-4 py-3 text-left border border-gray-400">Assignment Marks</th>
                <th className="px-4 py-3 text-left border border-gray-400">Total Duration (hrs)</th>
                <th className="px-4 py-3 text-left border border-gray-400">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {overallData.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border border-gray-400 text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 border border-gray-400 font-medium text-gray-900">
                    {student.student_name}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-gray-700">
                    {student.topic_average_percentage}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-gray-700">
                    {student.assignment_percentage}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-gray-700">
                    {student.total_session_hours}
                  </td>
                  <td className="px-4 py-3 border border-gray-400 text-gray-700">
                    {student.last_login || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchOverallReport();
  }, [selectedDepartment]);

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {renderFilters()}
      {renderOverallReport()}
    </div>
  );
};

export default AdministratorReports;