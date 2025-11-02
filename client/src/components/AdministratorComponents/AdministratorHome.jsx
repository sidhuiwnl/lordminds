import React, { useEffect, useState } from "react";

const AdministratorHome = () => {
  const [departments, setDepartments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState({
    departments: false,
    topics: false,
  });

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
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          disabled={loading.departments || departments.length === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white w-full sm:w-1/2 disabled:bg-gray-100"
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