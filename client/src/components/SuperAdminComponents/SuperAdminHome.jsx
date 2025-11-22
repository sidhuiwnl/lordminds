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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // College search states
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const collegeRef = useRef(null);

  // Department search states
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const departmentRef = useRef(null);

  const API_URL = import.meta.env.VITE_BACKEND_API_URL;

  // Fetch superadmin report
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

  // Fetch all colleges
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

  // Fetch departments when college changes
  useEffect(() => {
    if (!selectedCollege) {
      setDepartments([]);
      setTopics([]);
      setStudents([]);
      setSelectedDepartment("");
      return;
    }

    const fetchDepartments = async () => {
      setLoading((p) => ({ ...p, departments: true }));
      try {
        const res = await fetch(`${API_URL}/colleges/${selectedCollege}/departments`);
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

  // Fetch topics when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setTopics([]);
      setStudents([]);
      return;
    }

    const fetchTopics = async () => {
      setLoading((p) => ({ ...p, topics: true }));
      try {
        const res = await fetch(`${API_URL}/departments/${selectedDepartment}/topics`);
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

  // Fetch students' overall averages
  useEffect(() => {
    if (!selectedCollege || !selectedDepartment) {
      setStudents([]);
      return;
    }

    const fetchStudentReports = async () => {
      setLoading((p) => ({ ...p, students: true }));
      try {
        const res = await fetch(
          `${API_URL}/topics/overall-report/${selectedCollege}/${selectedDepartment}`
        );
        const data = await res.json();
        if (data.status === "success") {
          setStudents(data.data || []);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error("Error fetching student reports:", error);
        setStudents([]);
      } finally {
        setLoading((p) => ({ ...p, students: false }));
      }
    };

    fetchStudentReports();
  }, [selectedCollege, selectedDepartment, API_URL]);

  // Reset pagination when students change
  useEffect(() => {
    setCurrentPage(1);
  }, [students]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(students.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 800, behavior: "smooth" }); // Smooth scroll to table
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Filter colleges & departments
  const filteredColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const filteredDepartments = departments.filter((dept) =>
    dept.department_name.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  // Selection handlers
  const handleCollegeSelect = (collegeId, collegeName) => {
    setSelectedCollege(collegeId);
    setCollegeSearch(collegeName);
    setShowCollegeDropdown(false);
    setSelectedDepartment("");
    setDepartmentSearch('');
    setStudents([]);
  };

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Chart data
  const chartData = reportData?.topics
    ? {
        labels: reportData.topics.map((t) => t.topic_name),
        datasets: [
          {
            label: "Total Students",
            data: reportData.topics.map((t) => t.total_students),
            backgroundColor: reportData.topics.map((t) =>
              t.total_students > 0 ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)"
            ),
            borderColor: reportData.topics.map((t) =>
              t.total_students > 0 ? "rgba(34, 197, 94, 1)" : "rgba(239, 68, 68, 1)"
            ),
            borderWidth: 1,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      x: { ticks: { maxRotation: 90, minRotation: 45 } },
    },
    animation: { duration: reportData?.topics?.length > 50 ? 0 : 1000 },
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

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 mb-6 transition-all hover:shadow-md">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Students vs Topics</h2>
        {loading.report ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : reportData?.topics && reportData.topics.length > 0 ? (
          <div className="relative h-[400px] sm:h-[450px] lg:h-[500px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">No topics available.</div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1" ref={collegeRef}>
          <input
            type="text"
            value={collegeSearch}
            onChange={(e) => setCollegeSearch(e.target.value)}
            onFocus={() => setShowCollegeDropdown(true)}
            placeholder={loading.colleges ? "Loading colleges..." : "Search College..."}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full bg-white transition-all pr-8"
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
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">No colleges found.</div>
              )}
            </div>
          )}
          {selectedCollege && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        <div className="relative flex-1" ref={departmentRef}>
          <input
            type="text"
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            onFocus={() => selectedCollege && setShowDepartmentDropdown(true)}
            placeholder={
              !selectedCollege
                ? "Select a college first"
                : loading.departments
                ? "Loading departments..."
                : "Search Department..."
            }
            disabled={!selectedCollege}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 w-full bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all pr-8"
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
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">No departments found.</div>
              )}
            </div>
          )}
          {selectedDepartment && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="px-4 py-3 bg-white rounded-lg shadow hover:shadow-md transition-all border border-gray-200 text-center"
                >
                  <p className="text-sm font-medium text-gray-700">{topic.topic_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 bg-white rounded-lg border shadow-sm">
              No topics available for this department.
            </div>
          )
        ) : (
          <div className="text-center text-gray-500 py-8 bg-white rounded-lg border shadow-sm">
            Select a department to view topics.
          </div>
        )}
      </div>

      {/* Students Table with Pagination */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Students Performance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-[#175d9e] text-white">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Overall Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Last Login</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading.students ? (
                <tr>
                  <td colSpan="3" className="text-center py-12">
                    <div className="animate-spin inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </td>
                </tr>
              ) : currentStudents.length > 0 ? (
                currentStudents.map((student, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {indexOfFirstItem + idx + 1}. {student.student_name} - {student.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {(student.overall_percentage || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.last_login ? new Date(student.last_login).toLocaleString() : "Never"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-12 text-gray-500">
                    {selectedDepartment ? "No students found in this department." : "Select a college and department to view students."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {students.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">{Math.min(indexOfLastItem, students.length)}</span> of{" "}
              <span className="font-medium">{students.length}</span> students
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage > totalPages - 3) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return pageNum >= 1 && pageNum <= totalPages ? (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded text-sm ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ) : null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminHome;