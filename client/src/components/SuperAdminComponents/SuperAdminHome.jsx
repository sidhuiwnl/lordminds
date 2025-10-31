import React, { useEffect, useState } from "react";

const SuperAdminHome = () => {
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState({
    colleges: false,
    departments: false,
    topics: false,
    students: false,
  });

  // ✅ Fetch all colleges
  useEffect(() => {
    const fetchColleges = async () => {
      setLoading((p) => ({ ...p, colleges: true }));
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/colleges/get-all`);
        const data = await res.json();
        if (data.status === "success") setColleges(data.data);
      } catch (error) {
        console.error("Error fetching colleges:", error);
      } finally {
        setLoading((p) => ({ ...p, colleges: false }));
      }
    };
    fetchColleges();
  }, []);

  // ✅ Fetch departments when college changes
  useEffect(() => {
    if (!selectedCollege) {
      setDepartments([]);
      setTopics([]);
      return;
    }

    const fetchDepartments = async () => {
      setLoading((p) => ({ ...p, departments: true }));
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/colleges/${selectedCollege}/departments`
        );
        const data = await res.json();
        if (data.status === "success") setDepartments(data.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setLoading((p) => ({ ...p, departments: false }));
      }
    };
    fetchDepartments();
  }, [selectedCollege]);

  // ✅ Fetch topics when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setTopics([]);
      setStudents([]); // clear old data
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

  // ✅ Fetch students' overall averages for selected college & department
  useEffect(() => {
    if (!selectedCollege || !selectedDepartment) return;

    const fetchStudentReports = async () => {
      setLoading((p) => ({ ...p, students: true }));
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/topics/overall-report/${selectedCollege}/${selectedDepartment}`
        );
        const data = await res.json();
        if (data.status === "success") setStudents(data.data);
        else setStudents([]);
      } catch (error) {
        console.error("Error fetching student reports:", error);
      } finally {
        setLoading((p) => ({ ...p, students: false }));
      }
    };

    fetchStudentReports();
  }, [selectedCollege, selectedDepartment]);

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* College Dropdown */}
        <select
          value={selectedCollege}
          onChange={(e) => {
            setSelectedCollege(e.target.value);
            setSelectedDepartment("");
            setStudents([]);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 flex-1 bg-white"
        >
          <option value="">
            {loading.colleges
              ? "Loading colleges..."
              : colleges.length
              ? "Select College"
              : "No colleges available"}
          </option>
          {colleges.map((college) => (
            <option key={college.college_id || college.id} value={college.college_id || college.id}>
              {college.name}
            </option>
          ))}
        </select>

        {/* Department Dropdown */}
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          disabled={!selectedCollege}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 flex-1 bg-white disabled:bg-gray-100"
        >
          <option value="">
            {!selectedCollege
              ? "Select a college first"
              : loading.departments
              ? "Loading departments..."
              : departments.length
              ? "Select Department"
              : "No departments found"}
          </option>
          {departments.map((dept) => (
            <option key={dept.department_id || dept.id} value={dept.department_id || dept.id}>
              {dept.department_name}
            </option>
          ))}
        </select>
      </div>

      {/* Topics Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Topics</h2>

        {loading.topics ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : selectedDepartment ? (
          topics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-all border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-700 text-center">{topic.topic_name}</p>
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

      {/* Students Table */}
      <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-[#175d9e] text-white">
              <th className="px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500">
                Student Name
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500">
                Overall Average
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500">
                Last Login Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading.students ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  Loading student data...
                </td>
              </tr>
            ) : students.length > 0 ? (
              students.map((student, idx) => (
                <tr key={idx}>
                  <td className="px-4 lg:px-6 py-4 border border-gray-500">
                    {idx + 1}. {student.student_name}
                  </td>
                  <td className="px-4 lg:px-6 py-4 border border-gray-500">
                    {student.overall_average ?? 0}
                  </td>
                  <td className="px-4 lg:px-6 py-4 border border-gray-500">
                    12/25 - 5:25 PM
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  No students found for this department.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminHome;
