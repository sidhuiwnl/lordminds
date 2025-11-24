import React, { useEffect, useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,        // ← ADD THIS
  PieController,
  LineElement,
  PointElement
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PieController, LineElement, PointElement);

const SuperAdminHome = () => {
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [reportData, setReportData] = useState(null);
  const [studentsByCollege, setStudentsByCollege] = useState([]);
  const [learningHours, setLearningHours] = useState([]);
  const [loadingLearning, setLoadingLearning] = useState(false);
  const [loading, setLoading] = useState({
    colleges: false,
    departments: false,
    topics: false,
    students: false,
    report: false,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search & Dropdown
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const collegeRef = useRef(null);
  const departmentRef = useRef(null);

  const API_URL = import.meta.env.VITE_BACKEND_API_URL;

  // Fetch superadmin report
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(p => ({ ...p, report: true }));
      try {
        const res = await fetch(`${API_URL}/superadmin/get-superadmin-report`);
        const data = await res.json();
        if (data.status === "success") {
          setReportData(data.data);
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(p => ({ ...p, report: false }));
      }
    };
    fetchReport();
  }, [API_URL]);

  useEffect(() => {
    const fetchDailyLearningHours = async () => {
      try {
        setLoadingLearning(true);
        const res = await fetch(`${API_URL}/superadmin/daily-learning-hours`);
        const data = await res.json();
        if (data.status === "success") {
          setLearningHours(data);
        }
      } catch (e) {
        console.error("Error loading learning hours:", e);
      } finally {
        setLoadingLearning(false);
      }
    };

    fetchDailyLearningHours();
  }, [API_URL]);


  useEffect(() => {
    const fetchStudentsByCollege = async () => {
      try {
        const res = await fetch(`${API_URL}/superadmin/students-by-college`);
        const data = await res.json();
        if (data.status === "success") {
          setStudentsByCollege(data.data);
        }
      } catch (error) {
        console.error("Error fetching students-by-college:", error);
      }
    };
    fetchStudentsByCollege();
  }, [API_URL]);

  // Fetch colleges
  useEffect(() => {
    const fetchColleges = async () => {
      setLoading(p => ({ ...p, colleges: true }));
      try {
        const res = await fetch(`${API_URL}/colleges/get-all`);
        const data = await res.json();
        if (data.status === "success") setColleges(data.data || []);
      } catch (error) {
        console.error("Error fetching colleges:", error);
      } finally {
        setLoading(p => ({ ...p, colleges: false }));
      }
    };
    fetchColleges();
  }, [API_URL]);

  // Fetch departments
  useEffect(() => {
    if (!selectedCollege) {
      setDepartments([]);
      setTopics([]);
      setStudents([]);
      setSelectedDepartment("");
      return;
    }

    const fetchDepartments = async () => {
      setLoading(p => ({ ...p, departments: true }));
      try {
        const res = await fetch(`${API_URL}/colleges/${selectedCollege}/departments`);
        const data = await res.json();
        if (data.status === "success") setDepartments(data.data || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setLoading(p => ({ ...p, departments: false }));
      }
    };
    fetchDepartments();
  }, [selectedCollege, API_URL]);

  // Fetch topics
  useEffect(() => {
    if (!selectedDepartment) {
      setTopics([]);
      setStudents([]);
      return;
    }

    const fetchTopics = async () => {
      setLoading(p => ({ ...p, topics: true }));
      try {
        const res = await fetch(`${API_URL}/departments/${selectedDepartment}/topics`);
        const data = await res.json();
        if (data.status === "success") setTopics(data.data || []);
      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(p => ({ ...p, topics: false }));
      }
    };
    fetchTopics();
  }, [selectedDepartment, API_URL]);

  // Fetch student reports
  useEffect(() => {
    if (!selectedCollege || !selectedDepartment) {
      setStudents([]);
      return;
    }



    const fetchStudentReports = async () => {
      setLoading(p => ({ ...p, students: true }));
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
        console.error("Error fetching students:", error);
        setStudents([]);
      } finally {
        setLoading(p => ({ ...p, students: false }));
      }
    };
    fetchStudentReports();
  }, [selectedCollege, selectedDepartment, API_URL]);

  // Reset page on data change
  useEffect(() => setCurrentPage(1), [students]);


  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} students (${percentage}%)`;
          }
        }
      }
    }
  };


  const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        font: { size: 14 },
        color: '#374151'
      }
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      cornerRadius: 8,
      padding: 12,
      titleFont: { size: 14 },
      bodyFont: { size: 13 },
      callbacks: {
        label: (context) => {
          return ` ${context.parsed.y} hours`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 10,
        color: "#6b7280",
        callback: (value) => `${value}h`
      },
      grid: {
        color: "rgba(0, 0, 0, 0.05)",
        drawBorder: false
      }
    },
    x: {
      ticks: {
        color: "#374151",
        maxRotation: 45,
        minRotation: 0
      },
      grid: {
        display: false
      }
    }
  },
  interaction: {
    mode: 'index' ,
    intersect: false,
  },
  animation: {
    duration: 1200,
    easing: 'easeOutQuart'
  }
};

  const prepareLineChartData = () => {
  if (!learningHours?.labels || !learningHours?.values) return null;

  return {
    labels: learningHours.labels,
    datasets: [
      {
        label: "Total Learning Hours",
        data: learningHours.values,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: "#3B82F6",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        fill: true,
      }
    ]
  };
};


  const generateColors = (count) => {
  const baseColors = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981",
    "#06B6D4", "#F43F5E", "#6366F1", "#A78BFA", "#F472B6",
    "#14B8A6", "#FBBF24", "#F87171", "#34D399", "#60A5FA"
  ];

  const colors = [];
  for (let i = 0; i < count; i++) {
    const color = baseColors[i % baseColors.length];
    colors.push(color);
    // Add lighter version for variety
    if (i % 8 === 7) {
      colors.push(color + "88"); // semi-transparent
    }
  }
  return colors;
};

 const preparePieChartData = () => {
  if (!studentsByCollege || studentsByCollege.length === 0) return null;

  const sorted = [...studentsByCollege].sort((a, b) => b.total_students - a.total_students);
  const top10 = sorted.slice(0, 10);
  const others = sorted.slice(10);
  const othersTotal = others.reduce((sum, c) => sum + c.total_students, 0);

  const finalData = othersTotal > 0
    ? [...top10, { college_name: "Others", total_students: othersTotal }]
    : top10;

  return {
    labels: finalData.map(c => c.college_name),
    datasets: [{
      data: finalData.map(c => c.total_students),
      backgroundColor: generateColors(finalData.length),
      borderColor: "#ffffff",
      borderWidth: 3,
    }]
  };
};



  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(students.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 800, behavior: "smooth" });
  };

  // Filtered lists
  const filteredColleges = colleges.filter(c =>
    c.name?.toLowerCase().includes(collegeSearch.toLowerCase())
  );
  const filteredDepartments = departments.filter(d =>
    d.department_name?.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  // Selection handlers
  const handleCollegeSelect = (id, name) => {
    setSelectedCollege(id);
    setCollegeSearch(name);
    setShowCollegeDropdown(false);
    setSelectedDepartment("");
    setDepartmentSearch('');
    setStudents([]);
  };

  const handleDepartmentSelect = (id, name) => {
    setSelectedDepartment(id);
    setDepartmentSearch(name);
    setShowDepartmentDropdown(false);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (collegeRef.current && !collegeRef.current.contains(e.target)) setShowCollegeDropdown(false);
      if (departmentRef.current && !departmentRef.current.contains(e.target)) setShowDepartmentDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === SMART CHART DATA PREPARATION ===
  const prepareChartData = () => {
    if (!reportData?.topics || reportData.topics.length === 0) return null;

    const sortedTopics = [...reportData.topics]
      .sort((a, b) => b.total_students - a.total_students);

    const MAX_VISIBLE = 20;
    const mainTopics = sortedTopics.slice(0, MAX_VISIBLE);
    const others = sortedTopics.slice(MAX_VISIBLE);
    const othersCount = others.reduce((sum, t) => sum + t.total_students, 0);

    const finalTopics = othersCount > 0
      ? [...mainTopics, { topic_name: "Others", total_students: othersCount }]
      : mainTopics;

    const isHorizontal = finalTopics.length > 12;

    return {
      data: {
        labels: finalTopics.map(t => t.topic_name),
        datasets: [{
          label: "Total Students",
          data: finalTopics.map(t => t.total_students),
          backgroundColor: finalTopics.map((t, i) =>
            i === finalTopics.length - 1 && othersCount > 0
              ? "rgba(156, 163, 175, 0.75)"   // Gray for "Others"
              : "rgba(99, 102, 241, 0.85)"    // Premium Indigo
          ),
          borderColor: finalTopics.map((t, i) =>
            i === finalTopics.length - 1 && othersCount > 0
              ? "rgb(156, 163, 175)"
              : "rgb(99, 102, 241)"
          ),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: (isHorizontal ? 'y' : 'x'),
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `Students: ${ctx.parsed.y || ctx.parsed.x}`
            }
          }
        },
        scales: isHorizontal
          ? {
            x: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#6b7280" },
              grid: { display: false }
            },
            y: {
              ticks: { autoSkip: false, color: "#374151" },
              grid: { color: "rgba(0,0,0,0.05)" }
            }
          }
          : {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#6b7280" },
              grid: { color: "rgba(0,0,0,0.05)" }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45,
                color: "#374151"
              },
              grid: { display: false }
            }
          },
        animation: { duration: reportData.topics.length > 30 ? 0 : 800 },
      },
      showOthersNote: othersCount > 0,
      totalTopics: reportData.topics.length
    };
  };

  const chartConfig = prepareChartData();

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition">
          {loading.report ? (
            <div className="h-16 flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Colleges</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reportData?.total_colleges || 0}</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition">
          {loading.report ? (
            <div className="h-16 flex items-center justify-center">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* PIE CHART */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Students Distribution by College
          </h2>

          {studentsByCollege.length === 0 ? (
            <div className="text-center py-16 text-gray-500">Loading...</div>
          ) : (
            <div className="h-[350px]">
              <Pie data={preparePieChartData()} options={pieOptions} />
            </div>
          )}
        </div>

        {/* LINE CHART */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Daily Total Learning Hours
          </h2>

          {loadingLearning ? (
            <div className="text-center py-16 text-gray-500">Loading...</div>
          ) : prepareLineChartData() ? (
            <div className="h-[350px]">
              <Line data={prepareLineChartData()} options={lineOptions} />
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">No data available.</div>
          )}
        </div>

      </div>


      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Students per Topic</h2>
        {loading.report ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : chartConfig ? (
          <>
            <div className="relative h-96 lg:h-[500px]">
              <Bar data={chartConfig.data} options={chartConfig.options} />
            </div>
            {chartConfig.showOthersNote && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Showing top {chartConfig.data.labels.length - 1} topics + "Others" ({chartConfig.totalTopics} total)
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">No topic data available.</div>
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
            placeholder={loading.colleges ? "Loading..." : "Search College..."}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {showCollegeDropdown && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
              {filteredColleges.length > 0 ? filteredColleges.map(c => (
                <div
                  key={c.college_id || c.id}
                  onClick={() => handleCollegeSelect(c.college_id || c.id, c.name)}
                  className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {c.name}
                </div>
              )) : (
                <div className="px-4 py-2.5 text-gray-500 text-sm">No colleges found</div>
              )}
            </div>
          )}
          {selectedCollege && <div className="absolute right-3 top-3 text-green-500">Check</div>}
        </div>

        <div className="relative flex-1" ref={departmentRef}>
          <input
            type="text"
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            onFocus={() => selectedCollege && setShowDepartmentDropdown(true)}
            placeholder={!selectedCollege ? "Select college first" : loading.departments ? "Loading..." : "Search Department..."}
            disabled={!selectedCollege}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition"
          />
          {showDepartmentDropdown && selectedCollege && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
              {filteredDepartments.length > 0 ? filteredDepartments.map(d => (
                <div
                  key={d.department_id || d.id}
                  onClick={() => handleDepartmentSelect(d.department_id || d.id, d.department_name)}
                  className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {d.department_name}
                </div>
              )) : (
                <div className="px-4 py-2.5 text-gray-500 text-sm">No departments found</div>
              )}
            </div>
          )}
          {selectedDepartment && <div className="absolute right-3 top-3 text-green-500">Check</div>}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Topics in Selected Department</h2>
        {loading.topics ? (
          <div className="text-center py-12">Loading topics...</div>
        ) : selectedDepartment && topics.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topics.map(t => (
              <div key={t.id} className="bg-white px-4 py-3 rounded-lg shadow border text-center text-sm font-medium text-gray-700 hover:shadow-md transition">
                {t.topic_name}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            {selectedDepartment ? "No topics in this department" : "Select a department to view topics"}
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Student Performance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#175d9e] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Overall %</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading.students ? (
                <tr><td colSpan={3} className="text-center py-16">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </td></tr>
              ) : currentStudents.length > 0 ? (
                currentStudents.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {indexOfFirstItem + i + 1}. {s.student_name} - {s.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {(s.overall_percentage || 0).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {s.last_login ? new Date(s.last_login).toLocaleString() : "Never"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="text-center py-16 text-gray-500">
                  {selectedDepartment ? "No students found" : "Select college & department"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {students.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-gray-700">
              Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, students.length)} of {students.length}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(+e.target.value); setCurrentPage(1); }}
                className="border rounded px-2 py-1 text-sm"
              >
                {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
              </select>
              <div className="flex gap-1">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage > totalPages - 3 ? totalPages - 4 + i : currentPage - 2 + i;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'border'}`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminHome;