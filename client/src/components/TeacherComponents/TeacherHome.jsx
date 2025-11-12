import { useEffect, useState } from "react";

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

    useEffect(() => {
        setFilteredDepartments(departments);
    }, [departments]);

    // 1️⃣ Get user ID from localStorage
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

    // 2️⃣ Fetch teacher + department
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

    // 3️⃣ Fetch topics progress when department changes
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

    // 4️⃣ Fetch student averages when topic is selected
    useEffect(() => {
        if (!selectedTopic) return;
        async function fetchStudentAverages() {
            setLoadingStudents(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_BACKEND_API_URL}/teacher/${selectedTopic}/overall-student-topic`
                );
                const data = await res.json();
                if (data.status === "success") {
                    // Add static lastLogin
                    const enriched = data.data.map((s) => ({
                        ...s,
                        lastLogin: "12/9/25 - 5:25 PM",
                    }));
                    setTopicStudents(enriched);
                } else {
                    setTopicStudents([]);
                }
            } catch (err) {
                console.error("Error fetching student averages:", err);
            } finally {
                setLoadingStudents(false);
            }
        }
        fetchStudentAverages();
    }, [selectedTopic]);

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
        setSelectedDept(dept.department_id);
        setSearchInput(dept.department_name); // Set input to selected department name
        setShowDropdown(false);
        setTopicStudents([]);
        setFilteredDepartments(departments);
    };

    // Clear search and reset when input is focused
    const handleInputFocus = () => {
        setShowDropdown(true);
        if (selectedDept) {
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
                if (selectedDept) {
                    const selectedDeptName = departments.find(d => d.department_id === selectedDept)?.department_name || "";
                    setSearchInput(selectedDeptName);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedDept, departments]);

    const getStatusInfo = (progress) => {
        if (progress === 100)
            return { text: "Completed", color: "bg-green-500", textColor: "text-green-700" };
        return { text: "In Progress", color: "bg-blue-500", textColor: "text-blue-700" };
    };

    if (loading)
        return <p className="p-6 text-gray-600 text-center">Loading teacher details...</p>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-col p-6 gap-6">
            {/* Department Filter */}
            <div className="relative w-full mb-4 department-dropdown">
                <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    onFocus={handleInputFocus}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
                />

                {/* Dropdown results */}
                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredDepartments.length > 0 ? (
                            filteredDepartments.map((dept) => (
                                <div
                                    key={dept.department_id}
                                    onClick={() => handleDepartmentSelect(dept)}
                                    className={`p-2 cursor-pointer hover:bg-blue-100 ${
                                        selectedDept === dept.department_id ? "bg-blue-50" : ""
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

            {/* Topic Cards */}
            <h1 className="font-bold text-3xl">Topics</h1>
            <main>
                {loadingTopics ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
                    </div>
                ) : selectedDept ? (
                    topics.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {topics.map((topic, i) => {
                                const status = getStatusInfo(topic.avg_progress_percent);
                                const isSelected = selectedTopic === topic.topic_id;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedTopic(topic.topic_id)}
                                        className={`cursor-pointer bg-white rounded-xl shadow-sm border p-4 transition hover:shadow-md ${
                                            isSelected ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-100"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-900">{topic.topic_name}</h3>
                                            <div className="flex items-center text-green-600 text-sm font-medium">
                                                🏆 {status.text}
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-7 mt-2 overflow-hidden">
                                            <div
                                                className={`${status.color} h-7 rounded-full transition-all`}
                                                style={{ width: `${topic.avg_progress_percent}%` }}
                                            >
                                                <span className="text-white font-bold p-2">
                                                    {topic.avg_progress_percent}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-600 mt-2">
                                            Process: {topic.avg_progress_percent}% &nbsp;|&nbsp; Score:{" "}
                                            <span className="font-semibold">{topic.avg_score}/100</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center bg-white border border-gray-200 rounded-xl py-10 shadow-sm">
                            <p className="text-gray-500">No topics found for this department.</p>
                        </div>
                    )
                ) : (
                    <div className="text-center bg-white border border-gray-200 rounded-xl py-10 shadow-sm">
                        <p className="text-gray-500">Select a department to view topics.</p>
                    </div>
                )}
            </main>

            {selectedTopic && (
                <div className="mt-30 w-full bg-gray-50 flex justify-center">
                    <div className="overflow-x-auto w-full">
                        {loadingStudents ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
                            </div>
                        ) : topicStudents.length > 0 ? (
                            <table className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <thead>
                                    <tr className="bg-[#1b65a6] text-white text-left text-sm">
                                        <th className="px-6 py-3 font-semibold border-r border-gray-400 rounded-tl-lg">
                                            Students Name
                                        </th>
                                        <th className="px-6 py-3 font-semibold border-r border-gray-400">
                                            Average Score
                                        </th>
                                        <th className="px-6 py-3 font-semibold rounded-tr-lg">
                                            Last Login Date & Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 text-sm bg-white">
                                    {topicStudents.map((s, index) => (
                                        <tr
                                            key={index}
                                            className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-3 border-r border-gray-400">
                                                <span className="font-medium">{index + 1}. </span> {s.student_name}
                                            </td>
                                            <td className="px-6 py-3 border-r border-gray-400">
                                                {s.average_score}
                                            </td>
                                            <td className="px-6 py-3">{s.lastLogin}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center bg-white border border-gray-200 rounded-xl py-10 shadow-sm">
                                <p className="text-gray-500">No student data found for this topic.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}