import React, { useEffect, useState } from "react";

const AdministratorHome = () => {
  const [departments, setDepartments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState({
    departments: false,
    topics: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [adminDetails, setAdminDetails] = useState(null);
  const [storedUser, setStoredUser] = useState(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  });

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
          setAdminDetails(data.data.user);
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

  // ✅ Fetch topics when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setTopics([]);
      return;
    }

    const fetchTopics = async () => {
      setLoading((p) => ({ ...p, topics: true }));
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/departments/${selectedDepartment}/topics`
        );
        const data = await res.json();
        if (data.status === "success") setTopics(data.data);
      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setLoading((p) => ({ ...p, topics: false }));
      }
    };

    fetchTopics();
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

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      {adminDetails && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Welcome, {adminDetails.full_name}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            College: <span className="font-medium">{adminDetails.college_name}</span>
          </p>
          <p className="text-sm text-gray-600">
            Address: {adminDetails.college_address}
          </p>
        </div>
      )}

      {/* Department Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Department
        </label>
        <div className="relative department-dropdown w-full sm:w-1/2">
          <input
            type="text"
            placeholder={loading.departments ? "Loading departments..." : "Search departments..."}
            value={searchInput}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            disabled={loading.departments || departments.length === 0}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((dept) => (
                  <div
                    key={dept.department_id}
                    onClick={() => handleDepartmentSelect(dept)}
                    className={`p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                      selectedDepartment === dept.department_id ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {dept.department_name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-500 text-sm text-center">
                  No departments found.
                </div>
              )}
            </div>
          )}
        </div>
        {departments.length === 0 && !loading.departments && (
          <p className="text-red-500 text-xs mt-1">No departments available</p>
        )}
      </div>

      {/* Topics Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Topics</h2>

        {loading.topics ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : selectedDepartment ? (
          topics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {topics.map((topic, index) => (
                <div
                  key={topic.topic_id || index}
                  className="px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-all border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-700 text-center">
                    Topic {index + 1} - {topic.topic_name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-6 bg-white border rounded-lg shadow-sm">
              <p className="text-sm">No topics available for this department.</p>
            </div>
          )
        ) : (
          <div className="text-center text-gray-500 py-6 bg-white border rounded-lg shadow-sm">
            <p className="text-sm">Select a department to view topics.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdministratorHome;