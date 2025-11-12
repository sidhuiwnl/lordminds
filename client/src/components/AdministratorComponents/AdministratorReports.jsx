import React, { useState, useEffect } from "react";

const AdministratorReports = () => {
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
          const depts = data.data.departments || [];
          setDepartments(depts);
          setFilteredDepartments(depts);
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
                    {student.student_name} - {student.full_name}
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