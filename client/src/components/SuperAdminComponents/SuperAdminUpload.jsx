import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
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
  const [assignmentData, setAssignmentData] = useState([])
  const [overviewDetails, setOverviewDetails] = useState([])
  const [colleges, setColleges] = useState([])
  const [assignmentDepartments, setAssignmentDepartments] = useState([])
  const [overviewDepartments, setOverviewDepartments] = useState([])
  const [mcqDepartments, setMcqDepartments] = useState([])
  const [topics, setTopics] = useState([])
  const [topicWithSub, setTopicWithSub] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [overviewPage, setOverviewPage] = useState(1);
  const [mcqPage, setMcqPage] = useState(1);

  const rowsPerPage = 10;

  const handleAddTopic = async () => {
    if (!topicName.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/topics/create-topic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic_name: topicName }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.reload();
        console.log("✅ Success:", data.message);
        toast(data.message); // or show toast
        setTopicName("");
        setIsModalOpen(false);
      } else {
        console.error("❌ Server error:", data.detail);
        toast("Failed to create topic: " + data.detail);
      }
    } catch (error) {
      console.error("⚠️ Network error:", error);
      toast("Something went wrong. Please try again.");
    }
  };

  const editor = useRef(null);

  const tabs = [
    { id: "upload-assignment", label: "Upload Assignment" },
    { id: "upload-overview", label: "Upload Overview" },
    { id: "upload-mcq", label: "Upload Questions" }
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

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    // Handle assignment form submission
    console.log("depatment", formData.department);

    const formDataToSend = new FormData();

    formDataToSend.append("test_type", "assignment");


    formDataToSend.append('college_id', formData.assignmentCollege);
    formDataToSend.append('department_id', formData.department); // Example department ID
    formDataToSend.append('assignment_number', formData.assignmentNo);
    formDataToSend.append('assignment_topic', formData.assignmentTopic);
    formDataToSend.append('start_date', formData.startDate);
    formDataToSend.append('end_date', formData.endDate);
    formDataToSend.append('file', formData.file);

    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tests/create`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
      body: formDataToSend
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
   
    toast.success("Assignment uploaded successfully!")
    window.location.reload();
  };



  const handleOverviewSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    // formDataToSend.append('college_id', formData.topicSelectionCollege);
    // formDataToSend.append('department_id', formData.topicSelectionDepartment); // Example department ID
    formDataToSend.append('topic_name', formData.topicName);
    formDataToSend.append('sub_topic_name', formData.subTopicName);
    formDataToSend.append('no_of_sub_topics', formData.noOfSubTopic);
    formDataToSend.append('video_link', formData.overviewVideo);
    formDataToSend.append('file_name', formData.overviewDocument.name);
    formDataToSend.append('overview_content', formData.overviewText);

    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/overviews/upload`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
      body: formDataToSend
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    toast.success("Overview uploaded successfully!")
    window.location.reload();

  };

  const handleEditorChange = (newContent) => {
    setFormData(prev => ({ ...prev, overviewText: newContent }));
  };

  const config = useMemo(() => ({
    readonly: false,
    height: 300,
    placeholder: 'Start editing the extracted text...',
  }), []);

  const handleMcqSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("test_type", "sub_topic");

    // formDataToSend.append('college_id', formData.mcqCollege);
    // formDataToSend.append('department_id', formData.mcqDepartment || 1); // Example department ID
    formDataToSend.append('topic_name', formData.mcqTopicName);
    formDataToSend.append('sub_topic_name', formData.mcqSubTopicName);
    formDataToSend.append('no_of_sub_topics', formData.mcqNoOfSubTopic);
    formDataToSend.append('file', formData.mcqFile);
    formDataToSend.append('file_name', formData.mcqFile.name);

    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/tests/create`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
      body: formDataToSend
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    toast.success("MCQ uploaded successfully!")
    window.location.reload();

  };



  useEffect(() => {
    async function assignmentDetails() {
      const resposne = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/assignments/get-all`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },

      })

      if (!resposne.ok) {
        throw new Error(`HTTP error! status: ${resposne.status}`);
      }

      const data = await resposne.json()
      setAssignmentData(data)
    }

    async function overviewDetails() {
      const resposne = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/overviews/get_all`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },

      })

      if (!resposne.ok) {
        throw new Error(`HTTP error! status: ${resposne.status}`);
      }

      const data = await resposne.json()
      setOverviewDetails(data.data)
    }

    async function fetchColleges() {
      const resposne = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/colleges/get-all`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },

      })

      if (!resposne.ok) {
        throw new Error(`HTTP error! status: ${resposne.status}`);
      }

      const data = await resposne.json()
      setColleges(data.data)

    }

    async function fetchTopicWithSubTopic() {
      const resposne = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/topics/get-topic-with-subtopics`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
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
  }, [])

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
    if (topicWithSub.length > 0) {
      setTopics(topicWithSub);
    } else {
      setTopics([]);
    }
  }, [formData.mcqDepartment, topicWithSub]);

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Pagination logic for Assignment
  const assignmentTotal = assignmentData.length;
  const assignmentTotalPages = Math.ceil(assignmentTotal / rowsPerPage);
  const paginatedAssignmentData = useMemo(() => 
    assignmentData.slice((assignmentPage - 1) * rowsPerPage, assignmentPage * rowsPerPage), 
    [assignmentData, assignmentPage]
  );
  const assignmentStartIdx = (assignmentPage - 1) * rowsPerPage + 1;
  const assignmentEndIdx = Math.min(assignmentPage * rowsPerPage, assignmentTotal);

  const handleAssignmentPrev = () => {
    if (assignmentPage > 1) setAssignmentPage(assignmentPage - 1);
  };

  const handleAssignmentNext = () => {
    if (assignmentPage < assignmentTotalPages) setAssignmentPage(assignmentPage + 1);
  };

  // Pagination logic for Overview
  const overviewRows = useMemo(() => {
    let serial = 1;
    return overviewDetails.reduce((acc, overview) => {
      const subRows = overview.sub_topics.map((subTopic) => ({
        topicSerial: serial,
        topic_id: overview.topic_id,
        topic_name: overview.topic_name,
        sub_topic_name: subTopic.sub_topic_name,
        overview_video_url: subTopic.overview_video_url,
        progress: subTopic.progress || "85%"
      }));
      serial++;
      return [...acc, ...subRows];
    }, []);
  }, [overviewDetails]);
  const overviewTotal = overviewRows.length;
  const overviewTotalPages = Math.ceil(overviewTotal / rowsPerPage);
  const paginatedOverviewRows = useMemo(() => 
    overviewRows.slice((overviewPage - 1) * rowsPerPage, overviewPage * rowsPerPage), 
    [overviewRows, overviewPage]
  );
  const overviewStartIdx = (overviewPage - 1) * rowsPerPage + 1;
  const overviewEndIdx = Math.min(overviewPage * rowsPerPage, overviewTotal);

  const handleOverviewPrev = () => {
    if (overviewPage > 1) setOverviewPage(overviewPage - 1);
  };

  const handleOverviewNext = () => {
    if (overviewPage < overviewTotalPages) setOverviewPage(overviewPage + 1);
  };

  // Pagination logic for MCQ
  const mcqRows = useMemo(() => {
    let serial = 1;
    return topicWithSub.reduce((acc, topic) => {
      const subRows = topic.sub_topics?.map((subTopic) => ({
        topicSerial: serial,
        topic_name: topic.topic_name,
        sub_topic_name: subTopic.sub_topic_name,
        total_questions: subTopic.total_questions,
        file_name: subTopic.file_name || "",
        progress: "65%"
      })) || [];
      serial++;
      return [...acc, ...subRows];
    }, []);
  }, [topicWithSub]);
  const mcqTotal = mcqRows.length;
  const mcqTotalPages = Math.ceil(mcqTotal / rowsPerPage);
  const paginatedMcqRows = useMemo(() => 
    mcqRows.slice((mcqPage - 1) * rowsPerPage, mcqPage * rowsPerPage), 
    [mcqRows, mcqPage]
  );
  const mcqStartIdx = (mcqPage - 1) * rowsPerPage + 1;
  const mcqEndIdx = Math.min(mcqPage * rowsPerPage, mcqTotal);

  const handleMcqPrev = () => {
    if (mcqPage > 1) setMcqPage(mcqPage - 1);
  };

  const handleMcqNext = () => {
    if (mcqPage < mcqTotalPages) setMcqPage(mcqPage + 1);
  };

  const getRowspan = useCallback((rows, startIdx, groupKey) => {
    let count = 1;
    const groupValue = rows[startIdx][groupKey];
    for (let j = startIdx + 1; j < rows.length; j++) {
      if (rows[j][groupKey] === groupValue) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, []);

  const renderPagination = (currentPage, totalPages, startIdx, endIdx, total, prevHandler, nextHandler) => (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
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

  const renderOverviewTbody = () => (
    <tbody className="divide-y divide-gray-500">
      {paginatedOverviewRows.map((row, idx) => {
        const isGroupStart = idx === 0 || paginatedOverviewRows[idx].topicSerial !== paginatedOverviewRows[idx - 1].topicSerial;
        let rowspan = 1;
        if (isGroupStart) {
          rowspan = getRowspan(paginatedOverviewRows, idx, 'topicSerial');
        }
        return (
          <tr key={`${row.topic_id}-${row.sub_topic_name}-${idx}`}>
            {isGroupStart && (
              <td rowSpan={rowspan} className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-l-0">
                {row.topicSerial}
              </td>
            )}
            {isGroupStart && (
              <td rowSpan={rowspan} className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
                {row.topic_name}
              </td>
            )}
            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
              {row.sub_topic_name}
            </td>
            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
              {row.overview_video_url}
            </td>
            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
              {row.progress}
            </td>
          </tr>
        );
      })}
    </tbody>
  );

  const renderMcqTbody = () => (
    <tbody className="divide-y divide-gray-500">
      {paginatedMcqRows.map((row, idx) => {
        const isGroupStart = idx === 0 || paginatedMcqRows[idx].topicSerial !== paginatedMcqRows[idx - 1].topicSerial;
        let rowspan = 1;
        if (isGroupStart) {
          rowspan = getRowspan(paginatedMcqRows, idx, 'topicSerial');
        }
        return (
          <tr key={`${row.topic_name}-${row.sub_topic_name}-${idx}`}>
            {isGroupStart && (
              <td rowSpan={rowspan} className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-l-0">
                {row.topicSerial}
              </td>
            )}
            {isGroupStart && (
              <td rowSpan={rowspan} className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
                {row.topic_name}
              </td>
            )}
            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
              {row.sub_topic_name}
            </td>
            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
              {row.total_questions} questions
            </td>
            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
              {row.file_name}
            </td>
            <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
              {row.progress}
            </td>
          </tr>
        );
      })}
    </tbody>
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Radio Tabs - Centered */}
      <ToastContainer />
      <div className="flex justify-center gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] lg:min-w-0 ${selectedTab === tab.id
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
              <a
                href="/sample_question_upload.xlsx"
                download
                className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow"

              >
                Download Template
              </a>
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
                  {paginatedAssignmentData.map((assignment, index) => (
                    <tr key={index}>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-l-0">
                        {((assignmentPage - 1) * rowsPerPage + index + 1)}
                      </td>
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
            {renderPagination(assignmentPage, assignmentTotalPages, assignmentStartIdx, assignmentEndIdx, assignmentTotal, handleAssignmentPrev, handleAssignmentNext)}
          </div>
        </>
      )}

      {selectedTab === "upload-overview" && (
        <>
          {/* Overview Form */}
          <form onSubmit={handleOverviewSubmit} className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Fill the details to upload overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
                <div className="flex flex-row gap-2">
                  <select
                    name="topicName"
                    value={formData.topicName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select Topic</option>
                    {topics.map((topic) => (
                      <option key={topic.topic_id} value={topic.topic_name}>{topic.topic_name}</option>
                    ))}

                  </select>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md transition"
                  >
                    +
                  </button>
                </div>

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
                    <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Students</th>
                  </tr>
                </thead>
                {renderOverviewTbody()}
              </table>
            </div>
            {renderPagination(overviewPage, overviewTotalPages, overviewStartIdx, overviewEndIdx, overviewTotal, handleOverviewPrev, handleOverviewNext)}
          </div>
        </>
      )}

      {selectedTab === "upload-mcq" && (
        <>
          {/* MCQ Form */}
          <form onSubmit={handleMcqSubmit} className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Fill the details to Upload Question's</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-6">
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
              <a
                href="/sample_question_upload.xlsx"
                download
                className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow"

              >
                Download Template
              </a>
              <button
                type="submit"
                className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow"
              >
                Upload Questions's
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
                {renderMcqTbody()}
              </table>
            </div>
            {renderPagination(mcqPage, mcqTotalPages, mcqStartIdx, mcqEndIdx, mcqTotal, handleMcqPrev, handleMcqNext)}
          </div>
        </>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-80">
            <h3 className="text-lg font-medium mb-4 text-gray-900">
              Add New Topic
            </h3>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Enter topic name"
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTopic}
                className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

  );

};

export default SuperAdminUpload;