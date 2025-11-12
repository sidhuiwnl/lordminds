import React, { useState, useEffect, useMemo } from "react";
import Select from 'react-select';

const AdministratorAccessCreation = () => {
  const [selectedAccessType, setSelectedAccessType] = useState("student");
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    username: "",
    password: "",
    college: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentPage, setStudentPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');
  const [studentDepartments, setStudentDepartments] = useState([]);
  
  // Search states
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  const rowsPerPage = 10;

  const API_BASE = import.meta.env.VITE_BACKEND_API_URL;

  const accessTypes = [
    { id: "student", label: "Student Access" },
    { id: "teacher", label: "Teacher Access" },
  ];

  const fetchColleges = async () => {
    try {
      const collegesRes = await fetch(`${API_BASE}/colleges/get-all`);
      if (collegesRes.ok) {
        const collegesData = await collegesRes.json();
        setColleges(collegesData.data || []);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
      setMessage({ type: "error", text: "Failed to load colleges" });
    }
  };

  const fetchDepartments = async () => {
    try {
      const deptsRes = await fetch(`${API_BASE}/departments/get-departments`);
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setMessage({ type: "error", text: "Failed to load departments" });
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/get/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/get/teachers`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchStudentDepartments = async (collegeId) => {
    if (!collegeId) {
      setStudentDepartments([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/colleges/${collegeId}/departments`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStudentDepartments(data.data || []);
    } catch (error) {
      console.error(error);
      setStudentDepartments([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchColleges(), fetchDepartments(), fetchStudents(), fetchTeachers()]);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCollegeFilter) {
      const college = colleges.find(c => c.name === selectedCollegeFilter);
      if (college && college.college_id) {
        fetchStudentDepartments(college.college_id);
      }
    } else {
      setStudentDepartments([]);
      setSelectedDepartmentFilter('');
    }
  }, [selectedCollegeFilter, colleges]);

  // Reset search when access type changes
  useEffect(() => {
    setStudentSearchQuery("");
    setTeacherSearchQuery("");
    setStudentPage(1);
    setTeacherPage(1);
  }, [selectedAccessType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const clearMessage = () => {
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      if (selectedAccessType === "student" && selectedFile) {
        const form = new FormData();
        form.append("file", selectedFile);
        form.append("role", "student");
        const res = await fetch(`${API_BASE}/users/bulk`, { method: "POST", body: form });
        const result = await res.json();
        setMessage({ type: res.ok ? "success" : "error", text: res.ok ? result.message : result.detail || "Bulk creation failed" });
        if (res.ok) {
          setSelectedFile(null);
          await fetchStudents();
        }
      } else {
        const roleMap = { student: "student", teacher: "teacher" };
        const payload = {
          role: roleMap[selectedAccessType],
          college_name: formData.college,
          username: formData.username,
          password: formData.password,
        };
        if (selectedAccessType === "student") payload.full_name = formData.name;
        if (["student", "teacher"].includes(selectedAccessType)) payload.department_name = formData.department;

        const res = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        setMessage({ type: res.ok ? "success" : "error", text: res.ok ? result.message : result.detail || "User creation failed" });
        if (res.ok) {
          setFormData({
            name: "", department: "", username: "", password: "", college: ""
          });
          const fetchFunc = selectedAccessType === 'student' ? fetchStudents : fetchTeachers;
          await fetchFunc();
        }
      }

      clearMessage();
    } catch (err) {
      setMessage({ type: "error", text: "Network error: " + err.message });
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const getFormTitle = () => {
    const titles = {
      student: "Student Access",
      teacher: "Teachers Access",
    };
    return titles[selectedAccessType];
  };

  const renderFormFields = () => {
    if (selectedAccessType === "student") {
      return (
        <>
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">1. College Name</label>
            <select 
              name="college" 
              value={formData.college} 
              onChange={handleInputChange}
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            >
              <option value="">Select College</option>
              {colleges.map((college) => (
                <option key={college.college_id || college.id} value={college.name}>{college.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">2. Department</label>
            <select 
              name="department" 
              value={formData.department} 
              onChange={handleInputChange}
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.department_id || dept.id} value={dept.department_name || dept.name}>{dept.department_name || dept.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">3. Student Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange}
              placeholder="Student name"
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">4. Username</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleInputChange}
              placeholder="Username"
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">5. Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange}
              placeholder="Password"
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">1. College Name</label>
            <select 
              name="college" 
              value={formData.college} 
              onChange={handleInputChange}
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            >
              <option value="">Select College</option>
              {colleges.map((college) => (
                <option key={college.college_id || college.id} value={college.name}>{college.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">2. Username</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleInputChange}
              placeholder="Username"
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">3. Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange}
              placeholder="Password"
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>
        </>
      );
    }
  };

  const getSubmitButtonText = () => {
    const texts = {
      student: "Create Access",
      teacher: "Create Access",
    };
    return texts[selectedAccessType];
  };

  const renderMessage = () => {
    if (!message.text) return null;
    return (
      <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
        message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}>
        {message.text}
      </div>
    );
  };

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Filtered students with search
  const filteredStudents = useMemo(() => 
    students.filter(student => 
      (!selectedCollegeFilter || student.college_name === selectedCollegeFilter) &&
      (!selectedDepartmentFilter || student.department_name === selectedDepartmentFilter) &&
      (studentSearchQuery === "" || 
        student.full_name?.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        student.username?.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        student.college_name?.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        student.department_name?.toLowerCase().includes(studentSearchQuery.toLowerCase()))
    ), 
    [students, selectedCollegeFilter, selectedDepartmentFilter, studentSearchQuery]
  );

  // Filtered teachers with search
  const filteredTeachers = useMemo(() => 
    teachers.filter(teacher => 
      teacherSearchQuery === "" || 
      teacher.username?.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      teacher.college_name?.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
      teacher.full_name?.toLowerCase().includes(teacherSearchQuery.toLowerCase())
    ), 
    [teachers, teacherSearchQuery]
  );

  const studentTotal = filteredStudents.length;
  const studentTotalPages = Math.ceil(studentTotal / rowsPerPage);
  const paginatedStudents = useMemo(() => 
    filteredStudents.slice((studentPage - 1) * rowsPerPage, studentPage * rowsPerPage), 
    [filteredStudents, studentPage]
  );
  const studentStartIdx = (studentPage - 1) * rowsPerPage + 1;
  const studentEndIdx = Math.min(studentPage * rowsPerPage, studentTotal);

  const handleStudentPrev = () => {
    if (studentPage > 1) setStudentPage(studentPage - 1);
  };

  const handleStudentNext = () => {
    if (studentPage < studentTotalPages) setStudentPage(studentPage + 1);
  };

  const teacherTotal = filteredTeachers.length;
  const teacherTotalPages = Math.ceil(teacherTotal / rowsPerPage);
  const paginatedTeachers = useMemo(() => 
    filteredTeachers.slice((teacherPage - 1) * rowsPerPage, teacherPage * rowsPerPage), 
    [filteredTeachers, teacherPage]
  );
  const teacherStartIdx = (teacherPage - 1) * rowsPerPage + 1;
  const teacherEndIdx = Math.min(teacherPage * rowsPerPage, teacherTotal);

  const handleTeacherPrev = () => {
    if (teacherPage > 1) setTeacherPage(teacherPage - 1);
  };

  const handleTeacherNext = () => {
    if (teacherPage < teacherTotalPages) setTeacherPage(teacherPage + 1);
  };

  const renderPagination = (currentPage, totalPages, startIdx, endIdx, total, prevHandler, nextHandler) => (
    <div className="p-4 border-t  border-gray-200 bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing {startIdx} to {endIdx} of {total} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevHandler}
            disabled={currentPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={nextHandler}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  const renderUserTable = () => {
    if (selectedAccessType === "student") {
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by College</label>
                <select
                  value={selectedCollegeFilter}
                  onChange={(e) => {
                    setSelectedCollegeFilter(e.target.value);
                    setSelectedDepartmentFilter('');
                    setStudentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Colleges</option>
                  {colleges.map((college) => (
                    <option key={college.college_id || college.id} value={college.name}>{college.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Department</label>
                <select
                  value={selectedDepartmentFilter}
                  onChange={(e) => {
                    setSelectedDepartmentFilter(e.target.value);
                    setStudentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={!selectedCollegeFilter}
                >
                  <option value="">All Departments</option>
                  {studentDepartments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_name}>{dept.department_name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Student Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
              <input
                type="text"
                placeholder="Search by name, username, college, or department..."
                value={studentSearchQuery}
                onChange={(e) => {
                  setStudentSearchQuery(e.target.value);
                  setStudentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800">List of Students</h2>
            <div className="text-sm text-gray-600">
              {studentTotal} student(s) found
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-[#1b64a5] text-white sticky top-0">
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">S.NO</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Full Name</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Username</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">College Name</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Department Name</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student, index) => (
                    <tr key={student.user_id}>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-l-0">
                        {((studentPage - 1) * rowsPerPage + index + 1)}
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{student.full_name}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{student.username}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{student.college_name}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{student.department_name}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">{formatDate(student.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm border border-gray-500">
                      {studentSearchQuery || selectedCollegeFilter || selectedDepartmentFilter ? "No students match your search criteria." : "No students found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {renderPagination(studentPage, studentTotalPages, studentStartIdx, studentEndIdx, studentTotal, handleStudentPrev, handleStudentNext)}
        </div>
      );
    } else if (selectedAccessType === "teacher") {
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <div className="p-4 bg-gray-50">
            {/* Teacher Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Teachers</label>
              <input
                type="text"
                placeholder="Search by username, college, or name..."
                value={teacherSearchQuery}
                onChange={(e) => {
                  setTeacherSearchQuery(e.target.value);
                  setTeacherPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800">List of Teachers</h2>
            <div className="text-sm text-gray-600">
              {teacherTotal} teacher(s) found
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-[#1b64a5] text-white sticky top-0">
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">S.NO</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Username</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">College Name</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500">
                {paginatedTeachers.length > 0 ? (
                  paginatedTeachers.map((teacher, index) => (
                    <tr key={teacher.user_id}>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-l-0">
                        {((teacherPage - 1) * rowsPerPage + index + 1)}
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{teacher.username}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{teacher.college_name}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">{formatDate(teacher.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm border border-gray-500">
                      {teacherSearchQuery ? "No teachers match your search criteria." : "No teachers found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {renderPagination(teacherPage, teacherTotalPages, teacherStartIdx, teacherEndIdx, teacherTotal, handleTeacherPrev, handleTeacherNext)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 lg:p-6 mt-30  min-h-screen">
      <div className="space-y-4 lg:space-y-6 mt-30 mx-0 lg:mx-4">
        <div className="flex justify-center gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
          {accessTypes.map((type) => (
            <div 
              key={type.id} 
              className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] lg:min-w-0 ${
                selectedAccessType === type.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
              onClick={() => setSelectedAccessType(type.id)}
            >
              <input
                type="radio"
                id={type.id}
                name="accessType"
                checked={selectedAccessType === type.id}
                onChange={() => setSelectedAccessType(type.id)}
                className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor={type.id} className="text-xs lg:text-sm font-medium text-gray-700 cursor-pointer">
                {type.label}
              </label>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
            <div className="flex justify-between items-center mb-6 lg:mb-8">
              <h2 className="font-bold text-lg lg:text-xl text-gray-800">Fill the details to create {getFormTitle()}</h2>
              {selectedAccessType === "student" && (
                 <div className="flex gap-3">
                <a 
                 download
                 href="/sample_students.xlsx"
                  className="bg-gray-500 text-white px-5 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </a>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button 
                    type="button" 
                    className="bg-blue-500 text-white px-5 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 20l-5.5-5.5M15 20l5.5-5.5" />
                    </svg>
                    Upload Excel
                  </button>
                </div>
              </div>
              )}
            </div>
            
            <div className="space-y-4">
              {renderFormFields()}
            </div>

            {renderMessage()}
          </div>

          <div className="flex justify-center mt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : getSubmitButtonText()}
            </button>
          </div>
        </form>

        {renderUserTable()}
      </div>
    </div>
  );
};

export default AdministratorAccessCreation;