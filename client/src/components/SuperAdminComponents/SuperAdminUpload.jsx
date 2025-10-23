import React, { useState, useRef, useMemo, useEffect } from "react";
import { Edit, Trash2 } from "lucide-react";
import JoditEditor from 'jodit-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ToastContainer, toast } from 'react-toastify';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const SuperAdminUpload = () => {
  const [selectedTab, setSelectedTab] = useState("upload-assignment");
  const [formData, setFormData] = useState({
    // Assignment form data
    assignmentCollege: "",
    department: "",
    assignmentNo: "",
    assignmentTopic: "",
    startDate: "",
    endDate: "",
    file: null,
    // Overview form data
    topicSelectionCollege: "",
    topicSelectionDepartment: "",
    topicName: "",
    subTopicName: "",
    noOfSubTopic: "",
    overviewVideo: "",
    overviewDocument: null,
    overviewText: "",
    // MCQ form data
    mcqCollege: "",
    mcqDepartment: "",
    mcqTopicName: "",
    mcqSubTopicName: "",
    mcqNoOfSubTopic: "",
    mcqFile: null,
  });
  const[assignmentData,setAssignmentData] = useState([])
  const[overviewDetails,setOverviewDetails] = useState([])
  const[colleges,setColleges] = useState([])
  const[assignmentDepartments,setAssignmentDepartments] = useState([])
  const[overviewDepartments,setOverviewDepartments] = useState([])
  const[mcqDepartments,setMcqDepartments] = useState([])
  const [topics, setTopics] = useState([])
  const[topicWithSub,setTopicWithSub] = useState([])

  

  const editor = useRef(null);

  

  const tabs = [
    { id: "upload-assignment", label: "Upload Assignment" },
    { id: "upload-overview", label: "Upload Overview" },
    { id: "upload-mcq", label: "Upload MCQ" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (name === 'overviewDocument') {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          let extractedText = '';
          try {
            if (file.name.endsWith('.pdf')) {
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                extractedText += content.items.map(item => item.str).join(' ') + '\n\n';
              }
            } else if (file.name.toLowerCase().endsWith('.docx')) {
              const result = await mammoth.extractRawText({ arrayBuffer });
              extractedText = result.value;
            }
            setFormData(prev => ({ ...prev, [name]: file, overviewText: `<p>${extractedText.replace(/\n/g, '</p><p>')}</p>` }));
          } catch (error) {
            console.error('Error extracting text:', error);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const fetchDepartmentsForCollege = async (collegeId, setter) => {
    if (!collegeId) {
      setter([]);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/colleges/${collegeId}/departments`, {
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
      toast.error("Failed to fetch departments");
      setter([]);
    }
  };

  const handleAssignmentSubmit = async(e) => {
    e.preventDefault();
    // Handle assignment form submission
   console.log("depatment",formData.department);

    const formDataToSend = new FormData();

    formDataToSend.append("test_type", "assignment");

    
    formDataToSend.append('college_id', formData.assignmentCollege);
    formDataToSend.append('department_id', formData.department); // Example department ID
    formDataToSend.append('assignment_number', formData.assignmentNo);
    formDataToSend.append('assignment_topic', formData.assignmentTopic);
    formDataToSend.append('start_date', formData.startDate);
    formDataToSend.append('end_date', formData.endDate);
    formDataToSend.append('file', formData.file);

    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tests/create`,{
      method : "POST",
      headers : {
        "Accept" : "application/json",
      },
      body : formDataToSend
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    toast.success("Assignment uploaded successfully!")
  };

  const handleOverviewSubmit = async(e) => {
    e.preventDefault();
    // Handle assignment form submission
    console.log("depatment",formData.topicSelectionDepartment);

    

    const formDataToSend = new FormData();

    


    formDataToSend.append('college_id', formData.topicSelectionCollege);
    formDataToSend.append('department_id', formData.topicSelectionDepartment); // Example department ID
    formDataToSend.append('topic_name', formData.topicName);
    formDataToSend.append('sub_topic_name', formData.subTopicName);
    formDataToSend.append('no_of_sub_topics', formData.noOfSubTopic);
    formDataToSend.append('video_link', formData.overviewVideo);
    formDataToSend.append('file_name', formData.overviewDocument.name);
    formDataToSend.append('overview_content', formData.overviewText);

    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/overviews/upload`,{
      method : "POST",
      headers : {
        "Accept" : "application/json",
      },
      body : formDataToSend
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    toast.success("Overview uploaded successfully!")
    
  };

  const handleEditorChange = (newContent) => {
    setFormData(prev => ({ ...prev, overviewText: newContent }));
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    placeholder: 'Start editing the extracted text...',
  }), []);

  const fetchTopicsForDepartment = async (deptId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/topics/topic-subtopic?department_id=${deptId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTopics(data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch topics");
    }
  };

  const handleMcqSubmit = async(e) => {
    e.preventDefault();
    // Handle assignment form submission
    


    const formDataToSend = new FormData();

    
    formDataToSend.append("test_type", "sub_topic");

    formDataToSend.append('college_id', formData.mcqCollege);
    formDataToSend.append('department_id', formData.mcqDepartment || 1); // Example department ID
    formDataToSend.append('topic_name', formData.mcqTopicName);
    formDataToSend.append('sub_topic_name', formData.mcqSubTopicName);
    formDataToSend.append('no_of_sub_topics', formData.mcqNoOfSubTopic);
    formDataToSend.append('file', formData.mcqFile);
    formDataToSend.append('file_name', formData.mcqFile.name);

    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tests/create`,{
      method : "POST",
      headers : {
        "Accept" : "application/json",
      },
      body : formDataToSend
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    toast.success("MCQ uploaded successfully!")
  };

  

  useEffect(() => {
    async function assignmentDetails() {
      const resposne = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/assignments`,{
        method : "GET",
        headers : {
          "Accept" : "application/json",
        },

      })

      if (!resposne.ok) {
        throw new Error(`HTTP error! status: ${resposne.status}`);
      }

      const data = await resposne.json()
      setAssignmentData(data)
    }

    async function overviewDetails() {
      const resposne = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/overviews`,{
        method : "GET",
        headers : {
          "Accept" : "application/json",
        },

      })

      if (!resposne.ok) {
        throw new Error(`HTTP error! status: ${resposne.status}`);
      }

      const data = await resposne.json()
      setOverviewDetails(data.data)
    }

    async function fetchColleges() {
      const resposne = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/colleges`,{
        method : "GET",
        headers : {
          "Accept" : "application/json",
        },

      })

      if (!resposne.ok) {
        throw new Error(`HTTP error! status: ${resposne.status}`);
      }

      const data = await resposne.json()
      setColleges(data.data)

    } 

    async function fetchTopicWithSubTopic() {
       const resposne = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/topics/get-topic-with-subtpics`,{
        method : "GET",
        headers : {
          "Accept" : "application/json",
        },

      })

      if (!resposne.ok) {
        throw new Error(`HTTP error! status: ${resposne.status}`);
      }

      const data = await resposne.json()
      setTopicWithSub(data.data)

    }

    overviewDetails()
    assignmentDetails()
    fetchColleges()
    fetchTopicWithSubTopic()
  },[])

  useEffect(() => {
    fetchDepartmentsForCollege(formData.assignmentCollege, setAssignmentDepartments);
  }, [formData.assignmentCollege]);

  useEffect(() => {
    fetchDepartmentsForCollege(formData.topicSelectionCollege, setOverviewDepartments);
  }, [formData.topicSelectionCollege]);

  useEffect(() => {
    fetchDepartmentsForCollege(formData.mcqCollege, setMcqDepartments);
  }, [formData.mcqCollege]);

  useEffect(() => {
    if (formData.mcqDepartment) {
      fetchTopicsForDepartment(formData.mcqDepartment);
    } else {
      setTopics([]);
    }
  }, [formData.mcqDepartment]); 

 function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
  

 

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Radio Tabs - Centered */}
      <ToastContainer/>
      <div className="flex justify-center gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <div 
            key={tab.id} 
            className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] lg:min-w-0 ${
              selectedTab === tab.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedTab(tab.id)}
          >
            <input
              type="radio"
              id={tab.id}
              name="uploadType"
              checked={selectedTab === tab.id}
              onChange={() => setSelectedTab(tab.id)}
              className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor={tab.id} className="text-xs lg:text-sm font-medium text-gray-700 cursor-pointer">
              {tab.label}
            </label>
          </div>
        ))}
      </div>

      {selectedTab === "upload-assignment" && (
        <>
          {/* Assignment Form */}
          <form onSubmit={handleAssignmentSubmit} className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Fill the details to create a assignment</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select College</label>
              <select 
                name="assignmentCollege" 
                value={formData.assignmentCollege} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select College</option>
                {colleges.map((college, index) => (
                  <option key={index} value={college.college_id}>{college.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
                <select 
                  name="department" 
                  value={formData.department} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Department</option>
                  {assignmentDepartments.map((dept, index) => (
                    <option key={index} value={dept.department_id}>{dept.department_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment No</label>
                <input 
                  type="text" 
                  name="assignmentNo" 
                  value={formData.assignmentNo} 
                  onChange={handleInputChange}
                  placeholder="Type assignment no"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Topic</label>
                <input 
                  type="text" 
                  name="assignmentTopic" 
                  value={formData.assignmentTopic} 
                  onChange={handleInputChange}
                  placeholder="Type assignment topic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Starting Date</label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={formData.startDate} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Ending Date</label>
                <input 
                  type="date" 
                  name="endDate" 
                  value={formData.endDate} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                <div className="relative">
                  <input 
                    type="file" 
                    name="file" 
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 20l-5.5-5.5M15 20l5.5-5.5" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">File Upload (doc 1mb)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
              >
                Download Template
              </button>
              <button 
                type="submit" 
                className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
              >
                Upload Assignment
              </button>
            </div>

          </form>

          {/* List of Uploaded Assignments */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-800">List of Uploaded Assignments</h2>
              <button className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
                Download
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs">(xlsx or pdf)</span>
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-[#1b64a5] text-white sticky top-0">
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">S.NO</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Department Name</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Assignment Name</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Starting Date</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">End Date</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">File Uploaded</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-500">
                  {assignmentData.map((assignment) => (
                    <tr key={assignment.no}>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-l-0">{assignment.assignment_number}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{assignment.department_name}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{assignment.assignment_topic}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{formatDate(assignment.start_date)}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{formatDate(assignment.end_date)}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">{assignment.file_name}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">{assignment.progress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedTab === "upload-overview" && (
        <>
          {/* Overview Form */}
          <form onSubmit={handleOverviewSubmit} className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Fill the details to upload overview</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select College</label>
              <select 
                name="topicSelectionCollege" 
                value={formData.topicSelectionCollege} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select College</option>
                {colleges.map((college, index) => (
                  <option key={index} value={college.college_id}>{college.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
                <select 
                  name="topicSelectionDepartment" 
                  value={formData.topicSelectionDepartment} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Department</option>
                  {overviewDepartments.map((dept, index) => (
                    <option key={index} value={dept.department_id}>{dept.department_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
                <input 
                  type="text" 
                  name="topicName" 
                  value={formData.topicName} 
                  onChange={handleInputChange}
                  placeholder="Type topic name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub - Topic Name</label>
                <input 
                  type="text" 
                  name="subTopicName" 
                  value={formData.subTopicName} 
                  onChange={handleInputChange}
                  placeholder="Type sub-topic name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No of Sub-Topic</label>
                <input 
                  type="number" 
                  name="noOfSubTopic" 
                  value={formData.noOfSubTopic} 
                  onChange={handleInputChange}
                  placeholder="Type no of sub-topic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overview Video</label>
                <input 
                  type="url" 
                  name="overviewVideo" 
                  value={formData.overviewVideo} 
                  onChange={handleInputChange}
                  placeholder="Enter video URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Enter video link</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overview Document</label>
                <div className="relative">
                  <input 
                    type="file" 
                    name="overviewDocument" 
                    onChange={handleFileChange}
                    accept=".pdf,.docx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 20l-5.5-5.5M15 20l5.5-5.5" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">File Upload (pdf or docx 1mb)</p>
              </div>
            </div>

            {formData.overviewText && (
              <div className="w-full mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Extracted Text (Editable)</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '300px', width: '100%' }}>
                  <JoditEditor
                    ref={editor}
                    value={formData.overviewText}
                    config={config}
                    tabIndex={1}
                    onBlur={handleEditorChange}
                    onChange={handleEditorChange}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button 
                type="submit" 
                className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
              >
                Upload Overview
              </button>
            </div>

          </form>

          {/* List of Uploaded Documents */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-800">List of Uploaded Documents</h2>
              <button className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
                Download
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs">(xlsx or pdf)</span>
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-[#1b64a5] text-white sticky top-0">
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">S.No</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Topic Name</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Sub-topic Name</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Video Link</th>
                    {/* <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Overview Document</th> */}
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Students</th>
                  </tr>
                </thead>
               <tbody className="divide-y divide-gray-500">
  {overviewDetails.flatMap((overview) => 
    overview.sub_topics.map((subTopic, subIndex) => {
      const isFirstSubTopic = subIndex === 0;
      
      return (
        <tr key={`${overview.topic_id}-${subTopic.sub_topic_id}`}>
          {isFirstSubTopic && (
            <>
              <td rowSpan={overview.sub_topics.length} className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-l-0">
                {overview.topic_id}
              </td>
              <td rowSpan={overview.sub_topics.length} className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
                {overview.topic_name}
              </td>
            </>
          )}
          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
            {subTopic.sub_topic_name}
          </td>
          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
            {subTopic.overview_video_url}
          </td>
          {/* <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
            {subTopic.file_name || "document1.doc"}
          </td> */}
          <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
            {subTopic.progress || "85%"}
          </td>
        </tr>
      );
    })
  )}
</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedTab === "upload-mcq" && (
        <>
          {/* MCQ Form */}
          <form onSubmit={handleMcqSubmit} className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Fill the details to Upload MCQ's</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select College</label>
              <select 
                name="mcqCollege" 
                value={formData.mcqCollege} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select College</option>
                {colleges.map((college, index) => (
                  <option key={index} value={college.college_id}>{college.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
                <select 
                  name="mcqDepartment" 
                  value={formData.mcqDepartment} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Department</option>
                  {mcqDepartments.map((dept, index) => (
                    <option key={index} value={dept.department_id}>{dept.department_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
                <select 
                  name="mcqTopicName" 
                  value={formData.mcqTopicName} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Topic</option>
                  {topics.map((topic) => (
                    <option key={topic.topic_id} value={topic.topic_name}>{topic.topic_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub - Topic Name</label>
                <select 
                  name="mcqSubTopicName" 
                  value={formData.mcqSubTopicName} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Sub-Topic</option>
                  {(() => {
                    const selectedTopic = topics.find(t => t.topic_name === formData.mcqTopicName);
                    return (selectedTopic ? selectedTopic.sub_topics : []).map((st) => (
                      <option key={st.sub_topic_id} value={st.sub_topic_name}>{st.sub_topic_name}</option>
                    ));
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No of Sub-Topic</label>
                <input 
                  type="number" 
                  name="mcqNoOfSubTopic" 
                  value={formData.mcqNoOfSubTopic} 
                  onChange={handleInputChange}
                  placeholder="Type no of sub-topic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MCQ's File Upload</label>
                <div className="relative">
                 <input 
                    type="file" 
                    name="mcqFile" 
                    onChange={handleFileChange}
                    accept=".xlsx,.xls"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />

                  <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 20l-5.5-5.5M15 20l5.5-5.5" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">File Upload (doc 2mb)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
              >
                Download Template
              </button>
              <button 
                type="submit" 
                className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
              >
                Upload MCQ's
              </button>
            </div>

          </form>

          {/* List of Uploaded MCQs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 lg:p-6 border-b border-gray-200 gap-4">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-800">List of Uploaded MCQ's</h2>
              <button className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
                Download
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs">(xlsx or pdf)</span>
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
  <table className="w-full min-w-[800px] border-collapse">
    <thead>
      <tr className="bg-[#1b64a5] text-white sticky top-0">
        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">No</th>
        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Topic Name</th>
        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Sub-topic Name</th>
        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">Number of questions</th>
        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">MCQ Document</th>
        <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Progress</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-500">
      {topicWithSub.flatMap((topic, topicIndex) =>
        topic.sub_topics.map((subTopic, subIndex) => {
          const isFirstSubTopic = subIndex === 0;
          const globalRowIndex = topics.slice(0, topicIndex).reduce((acc, t) => acc + t.sub_topics.length, 0) + subIndex + 1;
          
          return (
            <tr key={`${topic.topic_id}-${subTopic.sub_topic_id}`}>
              <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-l-0">
                {globalRowIndex}
              </td>
              {isFirstSubTopic && (
                <td rowSpan={topic.sub_topics.length} className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
                  {topic.topic_name}
                </td>
              )}
              <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
                {subTopic.sub_topic_name}
              </td>
              <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
                {subTopic.total_questions} questions
              </td>
              <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
                {subTopic.test_file || ""}
              </td>
              <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
                65%
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>
          </div>
        </>
      )}
    </div>
  );
};

export default SuperAdminUpload;