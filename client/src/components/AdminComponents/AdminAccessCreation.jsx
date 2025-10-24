import React, { useState, useEffect } from "react";
import Select from 'react-select';

const AdminAccessCreation = () => {
  const [selectedAccessType, setSelectedAccessType] = useState("college-onboarding");
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
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });

  

  const API_BASE = import.meta.env.VITE_BACKEND_API_URL; // Adjust to your FastAPI server URL

  // Define accessTypes here (before return)
  const accessTypes = [
    { id: "college-onboarding", label: "College Onboarding" },
    { id: "student", label: "Student Access" },
    { id: "teacher", label: "Teacher Access" },
    // { id: "admin", label: "Administrator Access" },
    // { id: "topic", label: "Topic Creation" }
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

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchColleges(), fetchDepartments(), fetchTopics()]);
    };

    fetchData();
  }, []);

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
    setSelectedFile(file);
  };

  const clearMessage = () => {
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
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
        if (res.ok) setFormData(prev => ({ ...prev, collegeName: "", collegeAddress: "", selectedDepartments: [] }));
      }

      else if (selectedAccessType === "student" && selectedFile) {
        const form = new FormData();
        form.append("file", selectedFile);
        form.append("role", "student");
        const res = await fetch(`${API_BASE}/users/bulk`, { method: "POST", body: form });
        const result = await res.json();
        setMessage({ type: res.ok ? "success" : "error", text: res.ok ? result.message : result.detail || "Bulk creation failed" });
        if (res.ok) setSelectedFile(null);
      }

      else if (selectedAccessType === "topic") {
        // Assign topics
        if (!formData.college || !formData.department || formData.selectedTopics.length === 0) {
          setMessage({ type: "error", text: "Select college, department, and at least one topic" });
        } else {
          const payload = {
            college_name: formData.college,
            department_name: formData.department,
            topics: formData.selectedTopics,
          };
          const res = await fetch(`${API_BASE}/topics/assign-topics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await res.json();
          setMessage({ type: res.ok ? "success" : "error", text: res.ok ? result.message : result.detail || "Topic assignment failed" });
          if (res.ok) setFormData(prev => ({ ...prev, college: "", department: "", selectedTopics: [] }));
        }
      }

      else {
        // Single user creation: student/teacher/admin
        const roleMap = { student: "student", teacher: "teacher", admin: "administrator" };
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
        if (res.ok) setFormData({
          collegeName: "", collegeAddress: "", selectedDepartments: [], name: "", department: "", username: "", password: "", college: "", selectedTopics: []
        });
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
      topic: "Topic Creation"
    };
    return titles[selectedAccessType];
  };

  const renderFormFields = () => {
    if (selectedAccessType === "college-onboarding") {
      return (
        <>
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">College Name</label>
            <input 
              type="text" 
              name="collegeName" 
              value={formData.collegeName} 
              onChange={handleInputChange}
              placeholder="College name"
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">College Address</label>
            <input 
              type="text" 
              name="collegeAddress" 
              value={formData.collegeAddress} 
              onChange={handleInputChange}
              placeholder="College address"
              className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
            />
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">Department</label>
            <div className="flex flex-1 gap-2 w-full">
              <Select
                isMulti
                options={departments.map(dept => ({ value: dept.department_name || dept.name, label: dept.department_name || dept.name }))}
                value={formData.selectedDepartments.map(deptName => ({ value: deptName, label: deptName }))}
                onChange={(options) => handleSelectChange(options, "selectedDepartments")}
                className="flex-1"
                placeholder="Select departments"
                isClearable
                closeMenuOnSelect={false}
              />
              <button
                type="button"
                onClick={() => setShowAddDeptModal(true)}
                className="bg-green-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-600 flex items-center gap-1 whitespace-nowrap"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
          </div>
        </>
      );
    } else if (selectedAccessType === "student") {
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
    } else if (selectedAccessType === "topic") {
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
            <label className="w-full lg:w-40 text-sm font-medium text-gray-700 mb-1 lg:mb-0 lg:pt-2 min-w-max">3. Topics</label>
            <div className="flex flex-1 gap-2 w-full">
              <Select
                isMulti
                options={topics.map(topic => ({ value: topic.topic_name || topic.name, label: topic.topic_name || topic.name }))}
                value={formData.selectedTopics.map(topicName => ({ value: topicName, label: topicName }))}
                onChange={(options) => handleSelectChange(options, "selectedTopics")}
                className="flex-1"
                placeholder="Select topics"
                isClearable
                closeMenuOnSelect={false}
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
      "college-onboarding": "Onboard College",
      student: "Create Access",
      teacher: "Create Access",
      admin: "Create Access",
      topic: "Assign Topics"
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

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        {/* Radio Tabs - Centered */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
            <div className="flex justify-between items-center mb-6 lg:mb-8">
              <h2 className="font-bold text-lg lg:text-xl text-gray-800">Fill the details to create {getFormTitle()}</h2>
              {selectedAccessType === "student" && (
                 <div className="flex gap-3">
                <button 
                  type="button" 
                  className="bg-gray-500 text-white px-5 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-1"
                  onClick={() => {
                    // Implement download template logic, e.g., generate and download Excel
                    console.log("Download template clicked");
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </button>
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                  <input 
                    type="text" 
                    value={deptForm.code}
                    onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter department code"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b65a6]"
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
      </div>
    </div>
  );
};

export default AdminAccessCreation;