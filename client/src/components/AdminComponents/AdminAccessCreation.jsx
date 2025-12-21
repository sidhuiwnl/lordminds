import React, { useState, useEffect } from "react";
import Select from 'react-select';
import { ToastContainer } from 'react-toastify';
import { CollegeTable } from "../SuperAdminComponents/AccessCreationTables/CollegeOnboardTable";
import { TeacherTable } from "../SuperAdminComponents/AccessCreationTables/TeacherTable";
import { StudentTable } from "../SuperAdminComponents/AccessCreationTables/StudentTable";
import { TopicTable } from "../SuperAdminComponents/AccessCreationTables/TopicTable";
import { AdminTable } from "../SuperAdminComponents/AccessCreationTables/AdministratorTable";


const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  name,
  valueKey = "value",
  labelKey = "label",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((o) => o[valueKey] === value);

  const filteredOptions = options.filter((o) =>
    o[labelKey].toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) setSearch("");
    }
  };

  const handleSelect = (opt) => {
    onChange({ target: { name, value: opt[valueKey] } });
    setIsOpen(false);
    setSearch("");
  };

  const handleSearchChange = (e) => setSearch(e.target.value);

  const handleClose = () => {
    setIsOpen(false);
    setSearch("");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest(".dropdown-container")) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative dropdown-container w-full">
      <div className="relative">
        <input
          type="text"
          readOnly
          value={selectedOption ? selectedOption[labelKey] : ""}
          onClick={handleToggle}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 h-[42px] ${disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "focus:ring-blue-500 border-gray-200 cursor-pointer hover:border-gray-300"
            }`}
          placeholder={placeholder}
          disabled={disabled}
        />
        <svg
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""
            } ${disabled ? "text-gray-400" : "text-gray-500"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full px-3 py-2 border-b border-gray-300 text-sm focus:outline-none"
          />
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
          ) : (
            filteredOptions.map((opt, index) => (
              <div
                key={index}
                onClick={() => handleSelect(opt)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              >
                {opt[labelKey]}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const SuperAdminAccessCreation = () => {
  const [selectedAccessType, setSelectedAccessType] = useState("college-onboarding");
  const [topicInput, setTopicInput] = useState("");

  const [formData, setFormData] = useState({
    collegeName: "",
    collegeAddress: "",
    selectedDepartments: [],
    name: "",
    department: "",
    username: "",
    password: "",
    college: "",
    givenAccess: "",
    selectedTopics: [],
    newTopics: [], // THIS WAS MISSING — NOW FIXED
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [collegesWithDepts, setCollegesWithDepts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');
  const [studentDepartments, setStudentDepartments] = useState([]);
  const [formDepartments, setFormDepartments] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [showBulkErrorsModal, setShowBulkErrorsModal] = useState(false);

  const rowsPerPage = 10;

  const API_BASE = import.meta.env.VITE_BACKEND_API_URL;

  const accessTypes = [
    { id: "college-onboarding", label: "College Onboarding" },
    { id: "student", label: "Student Access" },
    { id: "teacher", label: "Teacher Access" },
    // { id: "admin", label: "Administrator Access" },
    { id: "topic", label: "Topic Assign" }
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

  const fetchCollegesWithDepts = async () => {
    try {
      const res = await fetch(`${API_BASE}/colleges/get-all-with-department`);
      if (res.ok) {
        const data = await res.json();
        setCollegesWithDepts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching colleges with departments:", error);
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

  const fetchTopics = async () => {
    try {
      const topicsRes = await fetch(`${API_BASE}/topics/all-topics`);
      if (topicsRes.ok) {
        const topicsData = await topicsRes.json();
        setTopics(topicsData.data || []);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setMessage({ type: "error", text: "Failed to load topics" });
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

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/get/administrators`);
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const fetchStudentDepartments = async (collegeId, setter = setStudentDepartments) => {
    if (!collegeId) {
      setter([]);
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
      setter(data.data || []);
    } catch (error) {
      console.error(error);
      setter([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchColleges(), fetchCollegesWithDepts(), fetchDepartments(), fetchTopics(), fetchStudents(), fetchTeachers(), fetchAdmins()]);
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

  useEffect(() => {
    if ((selectedAccessType === "student" || selectedAccessType === "teacher" || selectedAccessType === "topic") && formData.college) {
      const college = colleges.find((c) => c.college_id === formData.college);
      if (college && college.college_id) {
        fetchStudentDepartments(college.college_id, setFormDepartments);
      } else {
        setFormDepartments([]);
      }
    } else {
      setFormDepartments([]);
    }
  }, [formData.college, selectedAccessType, colleges]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "selectedDepartments") {
      const options = Array.from(e.target.selectedOptions, (option) => option.value);
      setFormData(prev => ({ ...prev, [name]: options }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (selectedOptions, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: selectedOptions ? selectedOptions.map(option => option.value || option.department_name || option.topic_name) : []
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setMessage({ type: "", text: "" }); // Clear any previous messages
      setBulkErrors([]); // Clear any previous errors
    }
  };

  const handleTopicInputKey = (e) => {
    if (e.key === "Enter" && topicInput.trim() !== "") {
      e.preventDefault();

      setFormData(prev => ({
        ...prev,
        newTopics: [...prev.newTopics, topicInput.trim()]
      }));

      setTopicInput("");
    }
  };

  const handleRemoveTopic = (index) => {
    setFormData(prev => ({
      ...prev,
      newTopics: prev.newTopics.filter((_, i) => i !== index)
    }));
  };

  const clearMessage = () => {
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a file to upload" });
      return;
    }

    const college = colleges.find(c => c.college_id === formData.college);
    if (!college || !formData.department) {
      setMessage({ type: "error", text: "Please select college and department first" });
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", selectedFile);
    uploadFormData.append("role", "student");
    uploadFormData.append("college_name", college.name);
    uploadFormData.append("department_name", formData.department);

    try {
      setLoading(true);
      setBulkErrors([]);

      const res = await fetch(`${API_BASE}/users/bulk`, {
        method: "POST",
        body: uploadFormData
      });

      const result = await res.json();

      let messageType = "error";
      let messageText = result.message || result.detail || "Bulk upload failed";

      if (res.ok && result.status === "success") {
        messageType = "success";
        messageText = `Successfully created ${result.created_count} students in ${college.name} - ${formData.department}`;

        // Clear form data on success
        setSelectedFile(null);
        setFileName('');
        setFormData(prev => ({
          ...prev,
          name: "",
          department: "",
          username: "",
          password: "",
          college: ""
        }));

      } else if (res.ok && result.status === "partial") {
        messageType = "warning";
        messageText = `Created ${result.created_count} students in ${college.name} - ${formData.department}. ${result.errors?.length || 0} rows had errors.`;
        setBulkErrors(result.errors || []);
      } else if (res.ok && result.status === "error") {
        messageType = "error";
        messageText = result.message || "No valid students were created";
        setBulkErrors(result.errors || []);
      } else if (!res.ok) {
        // Handle non-ok responses
        setBulkErrors(result.errors || [result.detail] || ["An unknown error occurred."]);
      }

      setMessage({ type: messageType, text: messageText });

      // Refresh student list
      await fetchStudents();

      // Show errors modal if there are errors
      if (bulkErrors.length > 0) {
        setShowBulkErrorsModal(true);
      }

    } catch (error) {
      console.error("Bulk upload error:", error);
      setMessage({ type: "error", text: "Network error: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async () => {
    if (!deptForm.name || !deptForm.code) return;

    const formDataDept = new FormData();
    formDataDept.append("department_name", deptForm.name);
    formDataDept.append("department_code", deptForm.code);

    try {
      const response = await fetch(`${API_BASE}/departments/create`, {
        method: "POST",
        body: formDataDept,
      });

      const result = await response.json();
      if (response.ok) {
        setMessage({ type: "success", text: result.message });
        setShowAddDeptModal(false);
        setDeptForm({ name: "", code: "" });
        await fetchDepartments();
        window.location.reload();
        clearMessage();
      } else {
        setMessage({ type: "error", text: result.detail || "Department creation failed" });
        clearMessage();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error: " + error.message });
      clearMessage();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      if (selectedAccessType === "college-onboarding") {
        const payload = {
          name: formData.collegeName,
          address: formData.collegeAddress,
          departments: formData.selectedDepartments,
        };
        const res = await fetch(`${API_BASE}/colleges/onboard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        setMessage({ type: res.ok ? "success" : "error", text: res.ok ? result.message : result.detail || "College onboarding failed" });
        window.location.reload();
        if (res.ok) {
          setFormData(prev => ({ ...prev, collegeName: "", collegeAddress: "", selectedDepartments: [] }));
          await fetchCollegesWithDepts();
        }
      }

      else if (selectedAccessType === "student") {
        if (selectedFile) {
          await handleBulkUpload();
          // Don't reset form here - let handleBulkUpload handle it
        } else {
          // Individual student creation logic
          const college = colleges.find(c => c.college_id === formData.college);

          // Validate all fields
          if (!formData.name || !formData.username || !formData.password) {
            setMessage({ type: "error", text: "Please fill all required fields" });
            setLoading(false);
            return;
          }

          const payload = {
            role: "student",
            college_name: college?.name || "",
            full_name: formData.name,
            department_name: formData.department,
            username: formData.username,
            password: formData.password,
          };

          const res = await fetch(`${API_BASE}/users/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const result = await res.json();
          setMessage({
            type: res.ok ? "success" : "error",
            text: res.ok ? result.message : result.detail || "User creation failed"
          });

          if (res.ok) {
            // Clear form on success
            setFormData(prev => ({
              ...prev,
              name: "",
              department: "",
              username: "",
              password: "",
              college: ""
            }));
            await fetchStudents();
          }
        }
      }

      else if (selectedAccessType === "topic") {
        if (!formData.college || !formData.department || formData.selectedTopics.length === 0) {
          setMessage({ type: "error", text: "Select college, department and at least one topic" });
          setLoading(false);
          return;
        }




        const payload = {
          college_id: formData.college,
          department_id: formDepartments.find(d => d.department_name === formData.department)?.department_id,
          topic_ids: formData.selectedTopics
        };

        const res = await fetch(`${API_BASE}/topics/assign-topics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        setMessage({
          type: res.ok ? "success" : "error",
          text: result.message,
        });

        if (res.ok) {
          setFormData(prev => ({
            ...prev,
            college: "",
            department: "",
            selectedTopics: []
          }));

          setTopicInput("");
        }
        window.location.reload();
      }

      else {
        const college = colleges.find(c => c.college_id === formData.college);
        const roleMap = { teacher: "teacher", admin: "administrator" };
        const payload = {
          role: roleMap[selectedAccessType],
          college_name: college.name,
          username: formData.username,
          password: formData.password,
          full_name: formData.name
        };
        if (["teacher"].includes(selectedAccessType)) payload.department_name = formData.department;

        const res = await fetch(`${API_BASE}/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        setMessage({ type: res.ok ? "success" : "error", text: res.ok ? result.message : result.detail || "User creation failed" });
        if (res.ok) {
          setFormData({
            collegeName: "", collegeAddress: "", selectedDepartments: [], name: "", department: "", username: "", password: "", college: "", selectedTopics: [], newTopics: []
          });
          const fetchFunc = selectedAccessType === 'teacher' ? fetchTeachers : fetchAdmins;
          await fetchFunc();
          window.location.reload();
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
      "college-onboarding": "College Onboarding",
      student: "Student Access",
      teacher: "Teachers Access",
      admin: "Administrator Access",
      topic: "Topic Assigning"
    };
    return titles[selectedAccessType];
  };

  const renderFormFields = () => {
    if (selectedAccessType === "college-onboarding") {
      return (
        <>
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <ToastContainer />
            <label className="w-full lg:w-36 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">
              College Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="collegeName"
              value={formData.collegeName}
              onChange={handleInputChange}
              placeholder="College name"
              required
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">
              College Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="collegeAddress"
              value={formData.collegeAddress}
              onChange={handleInputChange}
              placeholder="College address"
              required
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 lg:pt-2">
              Departments <span className="text-red-500">*</span>
            </label>

            <div className="flex-1">
              <div className="border border-gray-300 rounded-lg p-2 min-h-[50px] flex flex-wrap gap-2">
                {formData.selectedDepartments.map((dept, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    <span>{dept}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          selectedDepartments: prev.selectedDepartments.filter((_, i) => i !== idx)
                        }))
                      }}
                      className="text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && deptForm.name.trim() !== "") {
                      e.preventDefault();
                      setFormData(prev => ({
                        ...prev,
                        selectedDepartments: [...prev.selectedDepartments, deptForm.name.trim()]
                      }));
                      setDeptForm({ name: "" });
                    }
                  }}
                  className="flex-1 min-w-[120px] px-2 py-1 outline-none text-sm"
                  placeholder="Type department & press Enter"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Press <b>Enter</b> to add department.
              </p>
            </div>
          </div>
        </>
      );
    } else if (selectedAccessType === "student") {
      return (
        <>
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">1. College Name</label>
            <div className="flex-1 w-full">
              <SearchableDropdown
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                options={colleges}
                valueKey="college_id"
                labelKey="name"
                placeholder="Select College"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">2. Department</label>
            <div className="flex-1 w-full">
              <SearchableDropdown
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                options={formDepartments}
                valueKey="department_name"
                labelKey="department_name"
                placeholder="Select Department"
                disabled={!formData.college}
              />
            </div>
          </div>

          {!selectedFile && (
            <>
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
          )}
        </>
      );
    } else if (selectedAccessType === "topic") {
      return (
        <>
          <div className="flex flex-col gap-4">

            <div className="flex flex-col lg:flex-row items-start gap-4">
              <label className="w-full lg:w-40 text-sm font-medium text-gray-700 lg:pt-2">
                1. College Name
              </label>
              <div className="flex-1 w-full">
                <SearchableDropdown
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  options={colleges}
                  valueKey="college_id"
                  labelKey="name"
                  placeholder="Select College"
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start gap-4">
              <label className="w-full lg:w-40 text-sm font-medium text-gray-700 lg:pt-2">
                2. Department
              </label>
              <div className="flex-1 w-full">
                <SearchableDropdown
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  options={formDepartments}
                  valueKey="department_name"
                  labelKey="department_name"
                  placeholder="Select Department"
                  disabled={!formData.college}
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start gap-4">
              <label className="w-full lg:w-40 text-sm font-medium text-gray-700 lg:pt-2">
                3. Topics
              </label>

              <Select
                isMulti
                className="flex-1 w-full"
                options={topics.map(t => ({
                  value: t.topic_id,
                  label: t.topic_name
                }))}
                onChange={(selected) =>
                  setFormData(prev => ({
                    ...prev,
                    selectedTopics: selected ? selected.map(s => s.value) : []
                  }))
                }
                placeholder="Select Topics"
              />

            </div>

          </div>
        </>
      );
    } else {
      // For teacher and admin
      return (
        <>
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">1. College Name</label>
            <div className="flex-1 w-full">
              <SearchableDropdown
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                options={colleges}
                valueKey="college_id"
                labelKey="name"
                placeholder="Select College"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>

          {selectedAccessType === "teacher" && (
            <div className="flex flex-col lg:flex-row items-start gap-4">
              <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">Department</label>
              <div className="flex-1 w-full">
                <SearchableDropdown
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  options={formDepartments}
                  valueKey="department_name"
                  labelKey="department_name"
                  placeholder="Select Department"
                  disabled={!formData.college}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">{selectedAccessType === "teacher" ? "3." : "2."} Username</label>
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
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">{selectedAccessType === "teacher" ? "4." : "3."} Password</label>
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
      "college-onboarding": "Onboard College",
      student: selectedFile ? "Bulk Upload Students" : "Create Student",
      teacher: "Create Teacher",
      admin: "Create Admin",
      topic: "Assign Topics"
    };
    return texts[selectedAccessType];
  };

  const renderMessage = () => {
    if (!message.text) return null;
    return (
      <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100 text-green-800" : message.type === "warning" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
        }`}>
        {message.text}
        {bulkErrors.length > 0 && message.type !== "success" && (
          <div className="mt-2">
            <button
              onClick={() => setShowBulkErrorsModal(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              View {bulkErrors.length} error{bulkErrors.length > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderUserTable = () => {
    switch (selectedAccessType) {
      case "college-onboarding":
        return <CollegeTable collegesWithDepts={collegesWithDepts} rowsPerPage={rowsPerPage} />;
      case "student":
        return (
          <StudentTable
            students={students}
            colleges={colleges}
            studentDepartments={studentDepartments}
            selectedCollegeFilter={selectedCollegeFilter}
            setSelectedCollegeFilter={setSelectedCollegeFilter}
            selectedDepartmentFilter={selectedDepartmentFilter}
            setSelectedDepartmentFilter={setSelectedDepartmentFilter}
            rowsPerPage={rowsPerPage}
          />
        );
      case "teacher":
        return <TeacherTable teachers={teachers} rowsPerPage={rowsPerPage} />;
      case "admin":
        return <AdminTable admins={admins} rowsPerPage={rowsPerPage} />;
      case "topic":
        return <TopicTable topics={topics} rowsPerPage={rowsPerPage} />
      default:
        return null;
    }
  };

  return (
    <div className="p-4 lg:p-6 mt-30 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        {/* Radio Tabs - Centered */}
        <div className="flex justify-center gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
          {accessTypes.map((type) => (
            <div
              key={type.id}
              className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] lg:min-w-0 ${selectedAccessType === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
                }`}
              onClick={() => {
                setSelectedAccessType(type.id);
                setTopicInput("");
                setSelectedFile(null);
                setFileName('');
                setFormData({
                  collegeName: "",
                  collegeAddress: "",
                  selectedDepartments: [],
                  name: "",
                  department: "",
                  username: "",
                  password: "",
                  college: "",
                  givenAccess: "",
                  selectedTopics: [],
                  newTopics: [], // Reset on tab change
                });
              }}
            >
              <input
                type="radio"
                id={type.id}
                name="accessType"
                checked={selectedAccessType === type.id}
                onChange={() => { }}
                className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor={type.id} className="text-xs lg:text-sm font-medium text-gray-700 cursor-pointer">
                {type.label}
              </label>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
            <div className="flex justify-between items-center mb-6 lg:mb-8">
              <h2 className="font-bold text-lg lg:text-xl text-gray-800">Fill the details to create {getFormTitle()}</h2>
              {selectedAccessType === "student" && (
                <div className="flex gap-3">
                  <a
                    download
                    href="/students.xlsx"
                    className="bg-gray-500 text-white px-5 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                  </a>

                  {/* File Upload Section */}
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={!formData.college || !formData.department}
                      id="bulk-upload-file"
                      key={selectedFile ? "file-selected" : "no-file"} // Add key to reset input
                    />
                    <label
                      htmlFor="bulk-upload-file"
                      className={`px-5 py-2 rounded-lg font-medium text-sm shadow-md transition-shadow flex items-center gap-1 cursor-pointer ${!formData.college || !formData.department
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:shadow-lg"
                        }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 20l-5.5-5.5M15 20l5.5-5.5" />
                      </svg>
                      {fileName ? fileName : 'Upload Excel'}
                    </label>
                  </div>

                  {/* Upload Now Button - Only show when file is selected */}
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleBulkUpload}
                      className="px-5 py-2 bg-green-500 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Upload Now
                    </button>
                  )}

                  {/* Clear File Button */}
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileName('');
                        // Reset file input
                        const fileInput = document.getElementById('bulk-upload-file');
                        if (fileInput) fileInput.value = '';
                      }}
                      className="px-5 py-2 bg-red-500 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear File
                    </button>
                  )}
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

        {/* Add Department Modal */}
        {showAddDeptModal && (
          <div
            className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddDeptModal(false)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add New Department</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                  <input
                    type="text"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter department name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6] h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                  <input
                    type="text"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter department code"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6] h-[42px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateDept}
                  disabled={!deptForm.name || !deptForm.code}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Department
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Errors Modal */}
        {showBulkErrorsModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowBulkErrorsModal(false)}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-red-800">Bulk Upload Errors</h3>
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">#</th>
                    <th scope="col" className="px-6 py-3">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkErrors.map((err, index) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4">{typeof err === 'object' ? JSON.stringify(err) : err}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkErrorsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminAccessCreation;