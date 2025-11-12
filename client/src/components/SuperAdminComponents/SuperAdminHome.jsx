import React, { useEffect, useState, useRef } from "react";
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

const SuperAdminHome = () => {
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState({
    colleges: false,
    departments: false,
    topics: false,
    students: false,
    report: false,
  });

  // College search states
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const collegeRef = useRef(null);

  // Department search states
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const departmentRef = useRef(null);

  const API_URL = import.meta.env.VITE_BACKEND_API_URL;

  // ✅ Fetch superadmin report
  useEffect(() => {
    const fetchReport = async () => {
      setLoading((p) => ({ ...p, report: true }));
      try {
        const res = await fetch(`${API_URL}/superadmin/get-superadmin-report`);
        const data = await res.json();
        if (data.status === "success") {
          setReportData(data.data);
        }
      } catch (error) {
        console.error("Error fetching superadmin report:", error);
      } finally {
        setLoading((p) => ({ ...p, report: false }));
      }
    };
    fetchReport();
  }, [API_URL]);

  // ✅ Fetch all colleges
  useEffect(() => {
    const fetchColleges = async () => {
      setLoading((p) => ({ ...p, colleges: true }));
      try {
        const res = await fetch(`${API_URL}/colleges/get-all`);
        const data = await res.json();
        if (data.status === "success") setColleges(data.data);
      } catch (error) {
        console.error("Error fetching colleges:", error);
      } finally {
        setLoading((p) => ({ ...p, colleges: false }));
      }
    };
    fetchColleges();
  }, [API_URL]);

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
          `${API_URL}/colleges/${selectedCollege}/departments`
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
  }, [selectedCollege, API_URL]);

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
          `${API_URL}/departments/${selectedDepartment}/topics`
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
  }, [selectedDepartment, API_URL]);

  // ✅ Fetch students' overall averages for selected college & department
  useEffect(() => {
    if (!selectedCollege || !selectedDepartment) return;

    const fetchStudentReports = async () => {
      setLoading((p) => ({ ...p, students: true }));
      try {
        const res = await fetch(
          `${API_URL}/topics/overall-report/${selectedCollege}/${selectedDepartment}`
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
  }, [selectedCollege, selectedDepartment, API_URL]);

  // Filter colleges based on search
  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  // Filter departments based on search
  const filteredDepartments = departments.filter((dept) =>
    dept.department_name.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  // Handle college selection
  const handleCollegeSelect = (collegeId, collegeName) => {
    setSelectedCollege(collegeId);
    setCollegeSearch(collegeName);
    setShowCollegeDropdown(false);
    setSelectedDepartment("");
    setStudents([]);
    setDepartmentSearch('');
  };

  // Handle department selection
  const handleDepartmentSelect = (deptId, deptName) => {
    setSelectedDepartment(deptId);
    setDepartmentSearch(deptName);
    setShowDepartmentDropdown(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (collegeRef.current && !collegeRef.current.contains(event.target)) {
        setShowCollegeDropdown(false);
      }
      if (departmentRef.current && !departmentRef.current.contains(event.target)) {
        setShowDepartmentDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Bar chart data for topics (Students vs Topics) - Vertical bars
  const chartData = reportData?.topics ? {
    labels: reportData.topics.map((topic) => topic.topic_name),
    datasets: [
      {
        label: "Total Students",
        data: reportData.topics.map((topic) => topic.total_students),
        backgroundColor: reportData.topics.map((topic) => 
          topic.total_students > 0 ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)"
        ),
        borderColor: reportData.topics.map((topic) => 
          topic.total_students > 0 ? "rgba(34, 197, 94, 1)" : "rgba(239, 68, 68, 1)"
        ),
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} students`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (value) => value === 0 ? 'No Students' : value,
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
          },
          maxRotation: 45,
        },
      },
    },
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all hover:shadow-md">
          {loading.report ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Colleges</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reportData?.total_colleges || 0}</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all hover:shadow-md">
          {loading.report ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Students</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reportData?.total_students || 0}</p>
            </>
          )}
        </div>
      </div>

      {/* Topics Bar Chart - Students vs Topics - Vertical */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6 transition-all hover:shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Students vs Topics</h2>
        {loading.report ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : reportData?.topics && reportData.topics.length > 0 ? (
          <div className="relative h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <p className="text-sm">No topics available.</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* College Search Dropdown */}
        <div className="relative flex-1" ref={collegeRef}>
          <input
            type="text"
            value={collegeSearch}
            onChange={(e) => setCollegeSearch(e.target.value)}
            onFocus={() => setShowCollegeDropdown(true)}
            placeholder={
              loading.colleges
                ? "Loading colleges..."
                : colleges.length
                ? "Search College..."
                : "No colleges available"
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full bg-white transition-all pr-8"
            onClick={() => setShowCollegeDropdown(true)}
          />
          {showCollegeDropdown && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
              {loading.colleges ? (
                <div className="px-4 py-2 text-gray-500">Loading...</div>
              ) : filteredColleges.length > 0 ? (
                filteredColleges.map((college) => (
                  <div
                    key={college.college_id || college.id}
                    onClick={() => handleCollegeSelect(college.college_id || college.id, college.name)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {college.name}
                  </div>
                ))
              ) : collegeSearch ? (
                <div className="px-4 py-2 text-gray-500 text-sm">No colleges found.</div>
              ) : null}
            </div>
          )}
          {selectedCollege && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Department Search Dropdown */}
        <div className="relative flex-1" ref={departmentRef}>
          <input
            type="text"
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            onFocus={() => !selectedCollege || setShowDepartmentDropdown(true)}
            placeholder={
              !selectedCollege
                ? "Select a college first"
                : loading.departments
                ? "Loading departments..."
                : departments.length
                ? "Search Department..."
                : "No departments found"
            }
            disabled={!selectedCollege}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all pr-8"
            onClick={() => selectedCollege && setShowDepartmentDropdown(true)}
          />
          {showDepartmentDropdown && selectedCollege && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
              {loading.departments ? (
                <div className="px-4 py-2 text-gray-500">Loading...</div>
              ) : filteredDepartments.length > 0 ? (
                filteredDepartments.map((dept) => (
                  <div
                    key={dept.department_id || dept.id}
                    onClick={() => handleDepartmentSelect(dept.department_id || dept.id, dept.department_name)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {dept.department_name}
                  </div>
                ))
              ) : departmentSearch ? (
                <div className="px-4 py-2 text-gray-500 text-sm">No departments found.</div>
              ) : null}
            </div>
          )}
          {selectedDepartment && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
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
            <div className="text-center text-gray-500 py-6 bg-white border rounded-lg shadow-sm transition-all">
              <p className="text-sm">No topics available for this department.</p>
            </div>
          )
        ) : (
          <div className="text-center text-gray-500 py-6 bg-white border rounded-lg shadow-sm transition-all">
            <p className="text-sm">Select a department to view topics.</p>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="w-full overflow-x-auto bg-white rounded-lg shadow transition-all">
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
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
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