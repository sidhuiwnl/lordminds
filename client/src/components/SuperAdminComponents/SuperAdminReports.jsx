import React, { useState, useEffect, useRef } from "react";
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

// --- Reusable Components ---

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalItems === 0) return null;

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage + 1;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-b-lg">
      <div className="text-sm text-gray-700 mb-2 sm:mb-0">
        Showing <span className="font-medium">{indexOfFirstItem}</span> to{" "}
        <span className="font-medium">{indexOfLastItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> results
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-50"
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-50"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const SearchableSelect = ({ label, value, onChange, options, searchValue, onSearchChange, disabled, placeholder, selectedDisplayName, showDropdown, setShowDropdown, allOptionLabel, refProp }) => {
  const inputRef = useRef(null);

  return (
    <div className="flex-1" ref={refProp}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchValue || (value ? selectedDisplayName : '')}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setShowDropdown(true);
            if (inputRef.current && value && !searchValue) {
              inputRef.current.select();
            }
          }}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          disabled={disabled}
        />
        <div
          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${
            showDropdown ? "block" : "hidden"
          }`}
        >
          {allOptionLabel && (
            <div
              key="all"
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-200"
              onClick={() => {
                onChange("");
                onSearchChange("");
                setShowDropdown(false);
              }}
            >
              {allOptionLabel}
            </div>
          )}
          {options.map((option) => {
            const displayName = option.name || option.college_name || option.department_name;
            const optionValue = option.id || option.college_id || option.department_id;
            return (
              <div
                key={option.id || optionValue}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                onClick={() => {
                  onChange(optionValue);
                  onSearchChange(displayName);
                  setShowDropdown(false);
                }}
              >
                {displayName}
              </div>
            );
          })}
          {options.length === 0 && !allOptionLabel && (
            <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              onSearchChange("");
              setShowDropdown(true);
              if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
              }
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-gray-600"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const SuperAdminReports = () => {
  const [selectedTab, setSelectedTab] = useState("current");
  const [assignmentMarksData, setAssignmentMarksData] = useState([]);
  const [topicAverageData, setTopicAverageData] = useState([]);
  const [durationData, setDurationData] = useState([]);
  const [overallData, setOverallData] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const collegeRef = useRef(null);
  const departmentRef = useRef(null);
  const [loading, setLoading] = useState({
    data: false,
    colleges: false,
    departments: false,
  });

  const tabs = [
    { id: "current", label: "Current Marks" },
    { id: "assignment", label: "Assignment Marks" },
    { id: "duration", label: "Total Duration" },
    { id: "overall", label: "Overall Reports" },
  ];

  const fetchColleges = async () => {
    setLoading((p) => ({ ...p, colleges: true }));
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/colleges/get-all`);
      const data = await res.json();
      if (data.status === "success") {
        setColleges(data.data);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setLoading((p) => ({ ...p, colleges: false }));
    }
  };

  const fetchDepartments = async () => {
    if (!selectedCollege) {
      setDepartments([]);
      setSelectedDepartment("");
      return;
    }
    setLoading((p) => ({ ...p, departments: true }));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/colleges/${selectedCollege}/departments`
      );
      const data = await res.json();
      if (data.status === "success") {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading((p) => ({ ...p, departments: false }));
    }
  };

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

  const fetchTopicAverages = async () => {
    if (!selectedDepartment) {
      setTopicAverageData([]);
      return;
    }
    setLoading((p) => ({ ...p, data: true }));
    try {
      const url = `${import.meta.env.VITE_BACKEND_API_URL}/assignments/topic-averages/${selectedDepartment}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "success") {
        setTopicAverageData(data.data);
      }
    } catch (error) {
      console.error("Error fetching topic averages:", error);
    } finally {
      setLoading((p) => ({ ...p, data: false }));
    }
  };

  const fetchTotalDuration = async () => {
    if (!selectedDepartment) {
      setDurationData([]);
      return;
    }
    setLoading((p) => ({ ...p, data: true }));
    try {
      const url = `${import.meta.env.VITE_BACKEND_API_URL}/assignments/total-duration/${selectedDepartment}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "success") {
        const sortedData = data.data.sort((a, b) => b.total_duration_hours - a.total_duration_hours);
        setDurationData(sortedData);
      }
    } catch (error) {
      console.error("Error fetching total duration:", error);
    } finally {
      setLoading((p) => ({ ...p, data: false }));
    }
  };

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
        const sortedData = data.data.sort((a, b) => {
          const avgA = (a.assignment_percentage + a.topic_average_percentage) / 2;
          const avgB = (b.assignment_percentage + b.topic_average_percentage) / 2;
          return avgB - avgA;
        });
        setOverallData(sortedData);
      }
    } catch (error) {
      console.error("Error fetching overall report:", error);
    } finally {
      setLoading((p) => ({ ...p, data: false }));
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [selectedCollege]);

  // Reset Pagination when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, selectedCollege, selectedDepartment]);

  useEffect(() => {
    setDepartmentSearch("");
    setShowDepartmentDropdown(false);
  }, [selectedCollege]);

  useEffect(() => {
    const currentCollege = colleges.find((c) => c.college_id === selectedCollege);
    if (
      collegeSearch &&
      (!currentCollege ||
        (!currentCollege.name?.toLowerCase().includes(collegeSearch.toLowerCase()) &&
          !currentCollege.college_name?.toLowerCase().includes(collegeSearch.toLowerCase())))
    ) {
      setSelectedCollege("");
      setSelectedDepartment("");
    }
  }, [collegeSearch, colleges, selectedCollege]);

  useEffect(() => {
    const currentDept = departments.find((d) => d.department_id === selectedDepartment);
    if (
      departmentSearch &&
      (!currentDept ||
        (!currentDept.name?.toLowerCase().includes(departmentSearch.toLowerCase()) &&
          !currentDept.department_name?.toLowerCase().includes(departmentSearch.toLowerCase())))
    ) {
      setSelectedDepartment("");
    }
  }, [departmentSearch, departments, selectedDepartment]);

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

  useEffect(() => {
    if (selectedTab === "assignment") {
      fetchAssignmentMarks();
    } else if (selectedTab === "current") {
      fetchTopicAverages();
    } else if (selectedTab === "duration") {
      fetchTotalDuration();
    } else if (selectedTab === "overall") {
      fetchOverallReport();
    }
  }, [selectedTab, selectedCollege, selectedDepartment]);

  const getColor = (percent) => {
    if (percent >= 90) return "text-green-600 font-semibold";
    if (percent >= 75) return "text-blue-600 font-semibold";
    if (percent >= 60) return "text-orange-500 font-medium";
    return "text-red-600 font-medium";
  };

  const getBarColor = (hours) => {
    if (hours < 2) return "#ef4444"; // Red
    if (hours < 4) return "#f97316"; // Orange
    if (hours < 6) return "#eab308"; // Yellow
    if (hours < 10) return "#3b82f6"; // Blue
    return "#22c55e"; // Green (More than 10)
  };

  const filteredColleges = colleges.filter(
    (college) =>
      college.name?.toLowerCase().includes(collegeSearch.toLowerCase()) ||
      college.college_name?.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name?.toLowerCase().includes(departmentSearch.toLowerCase()) ||
      dept.department_name?.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const selectedCollegeName = colleges.find((c) => c.college_id === selectedCollege)?.name || colleges.find((c) => c.college_id === selectedCollege)?.college_name || "";

  const selectedDepartmentName = departments.find((d) => d.department_id === selectedDepartment)?.name || departments.find((d) => d.department_id === selectedDepartment)?.department_name || "";

  const renderFilters = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <SearchableSelect
        label="Select College"
        value={selectedCollege}
        onChange={(val) => {
          setSelectedCollege(val);
          setSelectedDepartment("");
          setCollegeSearch("");
        }}
        options={filteredColleges}
        searchValue={collegeSearch}
        onSearchChange={setCollegeSearch}
        disabled={loading.colleges}
        placeholder="Search colleges..."
        selectedDisplayName={selectedCollegeName}
        showDropdown={showCollegeDropdown}
        setShowDropdown={setShowCollegeDropdown}
        allOptionLabel="All Colleges"
        refProp={collegeRef}
      />
      <SearchableSelect
        label="Select Department"
        value={selectedDepartment}
        onChange={(val) => setSelectedDepartment(val)}
        options={filteredDepartments}
        searchValue={departmentSearch}
        onSearchChange={setDepartmentSearch}
        disabled={!selectedCollege || loading.departments}
        placeholder="Search departments..."
        selectedDisplayName={selectedDepartmentName}
        showDropdown={showDepartmentDropdown}
        setShowDropdown={setShowDepartmentDropdown}
        allOptionLabel="All Departments"
        refProp={departmentRef}
      />
    </div>
  );

  // 🟦 Render Current Marks (Topic Averages)
  const renderCurrentMarks = () => {
    // Logic to prepare data before pagination
    const allTopics = [
      ...new Set(
        topicAverageData.flatMap((s) => s.topics.map((t) => t.topic_name))
      ),
    ];
    const rankedData = topicAverageData
      .map((s) => {
        const avg =
          s.topics.reduce((sum, t) => sum + t.average_percentage, 0) /
          s.topics.length;
        return { ...s, average: avg };
      })
      .sort((a, b) => b.average - a.average);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = rankedData.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <div>
        {renderFilters()}
        {(!selectedDepartment || loading.data) ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            {loading.data ? "Loading current marks..." : "Please select a department to view current marks."}
          </p>
        ) : !topicAverageData.length ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            No current marks available.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden min-w-[900px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1b64a5] text-white text-sm">
                    <th className="px-4 py-3 text-left border border-gray-400">
                      Students name in higher to lower score
                    </th>
                    {allTopics.map((topic, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left border border-gray-400"
                      >
                        {topic}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left border border-gray-400">
                      Average %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 text-sm">
                      <td className="px-4 py-3 font-medium text-gray-900 border border-gray-400">
                        {indexOfFirstItem + index}. {student.student_name} - {student.full_name}
                      </td>
                      {allTopics.map((topic, i) => {
                        const t = student.topics.find(
                          (tp) => tp.topic_name === topic
                        );
                        return (
                          <td
                            key={i}
                            className={`px-4 py-3 border border-gray-400 ${
                              t ? getColor(t.average_percentage) : "text-gray-400"
                            }`}
                          >
                            {t ? `${t.average_percentage.toFixed(0)}` : "-"}
                          </td>
                        );
                      })}
                      <td
                        className={`px-4 py-3 border border-gray-400 ${
                          getColor(student.average)
                        }`}
                      >
                        {student.average.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalItems={rankedData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // 🧾 Render Assignment Marks (total)
  const renderAssignmentMarks = () => {
    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = assignmentMarksData.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <div>
        {renderFilters()}
        {(!selectedDepartment || loading.data) ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            {loading.data ? "Loading assignment marks..." : "Please select a department to view assignment marks."}
          </p>
        ) : !assignmentMarksData.length ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            No assignment marks available.
          </p>
        ) : (
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
                  {currentItems.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 text-sm">
                      <td className="px-4 py-3 font-medium text-gray-900 border border-gray-400">
                        {indexOfFirstItem + index}. {student.student_name} - {student.full_name}
                      </td>
                      <td className="px-4 py-3 border border-gray-400 text-gray-700">
                        {student.total_marks_obtained}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalItems={assignmentMarksData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Total Duration
  const renderDuration = () => {
    // Pagination Logic for Bar Chart
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = durationData.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <div>
        {renderFilters()}
        {(!selectedDepartment || loading.data) ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            {loading.data ? "Loading total duration..." : "Please select a department to view total duration."}
          </p>
        ) : !durationData.length ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            No duration data available.
          </p>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Total Duration</h2>
            </div>
            <div className="relative h-96">
              <Bar
                data={{
                  labels: currentItems.map((d, i) => `${indexOfFirstItem + i}. ${d.student_name}`),
                  datasets: [
                    {
                      label: "Total Hours",
                      data: currentItems.map((d) => d.total_duration_hours),
                      backgroundColor: currentItems.map((d) => getBarColor(d.total_duration_hours)),
                      borderWidth: 0,
                      maxBarThickness: 35,
                      barPercentage: 0.7,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      // Set Max to highest value + padding to prevent bar clipping
                      max: Math.max(...durationData.map(d => d.total_duration_hours)) + 2 || 20,
                      title: {
                        display: true,
                        text: "Total Hours",
                      },
                    },
                    y: {
                      ticks: {
                        autoSkip: false,
                      },
                    },
                  },
                }}
              />
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalItems={durationData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />

            {/* UPDATED LEGEND BASED ON IMAGE */}
            <div className="flex flex-wrap justify-center gap-4 lg:gap-8 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#ef4444] rounded shadow-sm"></div>
                <span className="text-xs text-gray-600">Less than 2 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#f97316] rounded shadow-sm"></div>
                <span className="text-xs text-gray-600">Less than 4 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#eab308] rounded shadow-sm"></div>
                <span className="text-xs text-gray-600">Less than 6 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#3b82f6] rounded shadow-sm"></div>
                <span className="text-xs text-gray-600">Less than 10 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#22c55e] rounded shadow-sm"></div>
                <span className="text-xs text-gray-600">More than 10 hours</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Overall Reports
  const renderOverall = () => {
    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = overallData.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <div>
        {renderFilters()}
        {(!selectedDepartment || loading.data) ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            {loading.data ? "Loading overall reports..." : "Please select a department to view overall reports."}
          </p>
        ) : !overallData.length ? (
          <p className="text-gray-600 bg-white p-6 rounded-lg shadow text-center">
            No overall reports available.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden min-w-[1000px]">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Overall Reports</h2>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1b64a5] text-white text-sm">
                    <th className="px-4 py-3 text-left border border-gray-400">Student Name</th>
                    <th className="px-4 py-3 text-left border border-gray-400">Current Marks</th>
                    <th className="px-4 py-3 text-left border border-gray-400">Assignment Marks</th>
                    <th className="px-4 py-3 text-left border border-gray-400">Total Duration</th>
                    <th className="px-4 py-3 text-left border border-gray-400">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 text-sm">
                      <td className="px-4 py-3 font-medium text-gray-900 border border-gray-400">
                        {indexOfFirstItem + index}. {student.student_name} - {student.full_name}
                      </td>
                      <td className={`px-4 py-3 border border-gray-400 ${getColor(student.topic_average_percentage)}`}>
                        {student.topic_average_percentage}
                      </td>
                      <td className={`px-4 py-3 border border-gray-400 ${getColor(student.assignment_percentage)}`}>
                        {student.assignment_percentage}
                      </td>
                      <td className="px-4 py-3 border border-gray-400 text-gray-700">
                        {student.total_session_hours} hours
                      </td>
                      <td className="px-4 py-3 border border-gray-400 text-gray-700">
                        12/9 - 5:25 PM
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalItems={overallData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (selectedTab === "current") return renderCurrentMarks();
    if (selectedTab === "assignment") return renderAssignmentMarks();
    if (selectedTab === "duration") return renderDuration();
    if (selectedTab === "overall") return renderOverall();
    return null;
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Tabs */}
      <div className="flex justify-center mt-30 gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] ${
              selectedTab === tab.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
            onClick={() => setSelectedTab(tab.id)}
          >
            <input
              type="radio"
              id={tab.id}
              name="reportType"
              checked={selectedTab === tab.id}
              onChange={() => setSelectedTab(tab.id)}
              className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor={tab.id}
              className="text-xs lg:text-sm font-medium text-gray-700 cursor-pointer"
            >
              {tab.label}
            </label>
          </div>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};

export default SuperAdminReports;