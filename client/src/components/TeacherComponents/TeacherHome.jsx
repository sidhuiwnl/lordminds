import { useEffect, useState, useMemo } from "react";

export default function TeacherHome() {
    const [teacher, setTeacher] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [topics, setTopics] = useState([]);
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [topicStudents, setTopicStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [userId, setUserId] = useState(null);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    // Student table search & pagination
    const [studentSearch, setStudentSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 10;

    useEffect(() => {
        setFilteredDepartments(departments);
    }, [departments]);

    // 1. Get user ID
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                if (parsed?.user_id) setUserId(parsed.user_id);
            } catch (e) {
                console.error("Invalid user data in localStorage", e);
            }
        }
        setLoading(false);
    }, []);

    // 2. Fetch teacher + departments
    useEffect(() => {
        if (!userId) return;
        async function fetchTeacherAndDepartments() {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_API_URL}/teacher/teacher-details/${userId}`
                );
                const data = await res.json();

                if (data.status === "success") {
                    setTeacher(data.data);
                    const deptRes = await fetch(
                        `${import.meta.env.VITE_BACKEND_API_URL}/colleges/${data.data.college_id}/departments`
                    );
                    const deptData = await deptRes.json();
                    if (deptData.status === "success") setDepartments(deptData.data);
                }
            } catch (err) {
                console.error("Error fetching teacher or departments:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTeacherAndDepartments();
    }, [userId]);

    // 3. Fetch topics when department changes
    useEffect(() => {
        if (!selectedDept || !teacher?.college_id) {
            setTopics([]);
            return;
        }
        async function fetchTopicsProgress() {
            setLoadingTopics(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_API_URL}/teacher/department/${teacher.college_id}/${selectedDept}/topics-progress`
                );
                const data = await res.json();
                if (data.status === "success") setTopics(data.data);
            } catch (err) {
                console.error("Error fetching topics progress:", err);
            } finally {
                setLoadingTopics(false);
            }
        }
        fetchTopicsProgress();
    }, [selectedDept, teacher?.college_id]);

    // 4. Fetch students when topic selected
    useEffect(() => {
        if (!selectedTopic) {
            setTopicStudents([]);
            return;
        }
        async function fetchStudentAverages() {
            setLoadingStudents(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_API_URL}/teacher/${selectedTopic}/overall-student-topic`
                );
                const data = await res.json();
                if (data.status === "success") {
                    const enriched = data.data.map((s) => ({
                        ...s,
                        lastLogin: "12/9/25 - 5:25 PM", // Replace with real data later
                    }));
                    setTopicStudents(enriched);
                } else {
                    setTopicStudents([]);
                }
            } catch (err) {
                console.error("Error fetching student averages:", err);
                setTopicStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        }
        fetchStudentAverages();
    }, [selectedTopic]);

    // Department search
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

    const handleDepartmentSelect = (dept) => {
        setSelectedDept(dept.department_id);
        setSearchInput(dept.department_name);
        setShowDropdown(false);
        setSelectedTopic(null);
        setTopicStudents([]);
        setStudentSearch("");
        setCurrentPage(1);
    };

    const handleInputFocus = () => {
        setShowDropdown(true);
        if (selectedDept) {
            setSearchInput("");
            setFilteredDepartments(departments);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.department-dropdown')) {
                setShowDropdown(false);
                if (selectedDept) {
                    const name = departments.find(d => d.department_id === selectedDept)?.department_name || "";
                    setSearchInput(name);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedDept, departments]);

    // Status for topics (including empty ones)
    const getStatusInfo = (progress, totalStudents) => {
        if (totalStudents === 0 || progress === null || progress === undefined) {
            return { text: "No Students", color: "bg-gray-400", textColor: "text-gray-600" };
        }
        if (progress === 100) {
            return { text: "Completed", color: "bg-green-500", textColor: "text-green-700" };
        }
        return { text: "In Progress", color: "bg-blue-500", textColor: "text-blue-700" };
    };

    // Filter & paginate students
    const filteredStudents = useMemo(() => {
        if (!studentSearch.trim()) return topicStudents;
        return topicStudents.filter(s =>
            s.student_name.toLowerCase().includes(studentSearch.toLowerCase())
        );
    }, [topicStudents, studentSearch]);

    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * studentsPerPage;
        return filteredStudents.slice(start, start + studentsPerPage);
    }, [filteredStudents, currentPage]);

    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [studentSearch, selectedTopic]);

    if (loading) {
        return <p className="p-6 text-gray-600 text-center">Loading teacher details...</p>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 gap-8 flex flex-col">
            {/* Department Dropdown */}
            <div className="relative w-full max-w-md department-dropdown">
                <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    onFocus={handleInputFocus}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredDepartments.length > 0 ? (
                            filteredDepartments.map((dept) => (
                                <div
                                    key={dept.department_id}
                                    onClick={() => handleDepartmentSelect(dept)}
                                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 ${selectedDept === dept.department_id ? "bg-blue-100 font-medium" : ""
                                        }`}
                                >
                                    {dept.department_name}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-gray-500">No departments found.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Topics Section */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Topics</h1>

                {loadingTopics ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : selectedDept ? (
                    topics.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {topics.map((topic) => {
                                const hasData = topic.total_students > 0 && topic.avg_progress_percent !== null;
                                const progress = hasData ? topic.avg_progress_percent : 0;
                                const status = getStatusInfo(topic.avg_progress_percent, topic.total_students);
                                const isSelected = selectedTopic === topic.topic_id;

                                return (
                                    <div
                                        key={topic.topic_id}
                                        onClick={() => setSelectedTopic(topic.topic_id)}
                                        className={`cursor-pointer bg-white rounded-xl shadow-md border-2 p-5 transition-all hover:shadow-lg ${isSelected
                                            ? "border-blue-500 ring-4 ring-blue-100"
                                            : "border-gray-200"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-semibold text-lg text-gray-900">
                                                {topic.topic_name}
                                            </h3>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.textColor} bg-opacity-10`}>
                                                {status.text}
                                            </span>
                                        </div>

                                        {hasData ? (
                                            <>
                                                <div className="w-full bg-gray-200 rounded-full h-8 mt-3 overflow-hidden">
                                                    <div
                                                        className={`${status.color} h-full rounded-full transition-all flex items-center justify-center text-white font-bold`}
                                                        style={{ width: `${progress}%` }}
                                                    >
                                                        {progress}%
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-3">
                                                    Score: <strong>{topic.avg_score?.toFixed(1) || 0}/100</strong> |{" "}
                                                    {topic.total_students} student{topic.total_students > 1 ? "s" : ""}
                                                </p>
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <p className="text-lg">No students enrolled</p>
                                                <p className="text-xs mt-1">Progress data unavailable</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl shadow">
                            <p className="text-gray-500">No topics found for this department.</p>
                        </div>
                    )
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow">
                        <p className="text-gray-500 text-lg">Please select a department to view topics.</p>
                    </div>
                )}
            </div>

            {/* Student Table */}
            {selectedTopic && (
                <div className="mt-10 bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Student Performance — {topics.find(t => t.topic_id === selectedTopic)?.topic_name}
                        </h2>

                        {/* Search Input */}
                        <div className="mt-4 max-w-sm">
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {loadingStudents ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#1b65a6] text-white">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">No.</th>
                                            <th className="px-6 py-4 font-semibold">Student Name</th>
                                            <th className="px-6 py-4 font-semibold">Average Score</th>
                                            <th className="px-6 py-4 font-semibold">Last Login</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedStudents.map((s, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">{(currentPage - 1) * studentsPerPage + idx + 1}</td>
                                                <td className="px-6 py-4 font-medium">{s.student_name} - {s.full_name}</td>
                                                <td className="px-6 py-4">{s.average_score ?? "N/A"}</td>
                                                <td className="px-6 py-4 text-gray-600">{s.lastLogin}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <p className="text-sm text-gray-600">
                                        Showing {(currentPage - 1) * studentsPerPage + 1}–{Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <p>No students found {studentSearch && `for "${studentSearch}"`}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}