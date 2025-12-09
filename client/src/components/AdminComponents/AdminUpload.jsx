import React, { useState, useRef, useMemo, useEffect } from "react";
import Select from "react-select";
import JoditEditor from "jodit-react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { ToastContainer, toast } from "react-toastify";
import AssignmentTable from "../SuperAdminComponents/UploadSectionTables/AssignmentTable";
import OverviewTable from "../SuperAdminComponents/UploadSectionTables/OverviewTable";
import McqTable from "../SuperAdminComponents/UploadSectionTables/McqTable";

import "react-toastify/dist/ReactToastify.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const AdminUpload = () => {
  const [selectedTab, setSelectedTab] = useState("upload-assignment");

  const [formData, setFormData] = useState({
    // Assignment
    assignmentCollege: "",
    department: "",
    assignmentNo: "",
    assignmentTopic: "",
    startDate: "",
    endDate: "",
    file: null,
    // Overview (now uses topic_id)
    topicSelectionCollege: "",
    topicSelectionDepartment: "",
    topicId: "", // store topic_id
    subTopicName: "",
    noOfSubTopic: "",
    overviewVideo: "",
    overviewDocument: null,
    overviewText: "",
    // MCQ
    mcqCollege: "",
    mcqDepartment: "",
    mcqTopicId: "",
    mcqSubTopicName: "",
    mcqSubTopicId: "",
    mcqNoOfSubTopic: "",
    mcqFile: null,
  });

  const editor = useRef(null);
  const rowsPerPage = 10;

  // UI state & data
  const [assignmentData, setAssignmentData] = useState([]);
  const [overviewDetails, setOverviewDetails] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [assignmentDepartments, setAssignmentDepartments] = useState([]);
  const [overviewDepartments, setOverviewDepartments] = useState([]);
  const [mcqDepartments, setMcqDepartments] = useState([]);
  const [topics, setTopics] = useState([]); // topics for selected college+dept
  const [topicWithSub, setTopicWithSub] = useState([]); // original endpoint you used
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topicNameModal, setTopicNameModal] = useState("");
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [overviewPage, setOverviewPage] = useState(1);
  const [mcqPage, setMcqPage] = useState(1);

  const API_BASE = import.meta.env.VITE_BACKEND_API_URL;

  // generic helpers
  const setField = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // file handling & text extraction
  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;

    if (name === "overviewDocument") {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        let extractedText = "";
        try {
          if (file.name.toLowerCase().endsWith(".pdf")) {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              extractedText += content.items.map((item) => item.str).join(" ") + "\n\n";
            }
          } else if (file.name.toLowerCase().endsWith(".docx")) {
            const result = await mammoth.extractRawText({ arrayBuffer });
            extractedText = result.value;
          }
        } catch (err) {
          console.error("extract error:", err);
          toast.error("Failed to extract text from document");
        } finally {
          setField("overviewDocument", file);
          setField("overviewText", `<p>${extractedText.replace(/\n/g, "</p><p>")}</p>`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // other files (assignment, mcq)
      setField(name, files[0]);
    }
  };

  // fetchers
  const fetchColleges = async () => {
    try {
      const res = await fetch(`${API_BASE}/colleges/get-all`);
      if (!res.ok) throw new Error("Failed to fetch colleges");
      const data = await res.json();
      setColleges(data.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load colleges");
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${API_BASE}/assignments/get-all`);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data = await res.json();
      setAssignmentData(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOverviewDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/overviews/get_all`);
      if (!res.ok) throw new Error("Failed to fetch overviews");
      const data = await res.json();
      setOverviewDetails(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // topics with subtopics endpoint (if you still need it)
  const fetchTopicWithSubTopic = async () => {
    try {
      const res = await fetch(`${API_BASE}/topics/get-topic-with-subtopics`);
      if (!res.ok) throw new Error("Failed to fetch topicWithSub");
      const data = await res.json();
      setTopicWithSub(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // departments for a college
  const fetchDepartmentsForCollege = async (collegeId, setter) => {
    if (!collegeId) {
      setter([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/colleges/${collegeId}/departments`);
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      setter(data.data || []);
    } catch (e) {
      console.error(e);
      setter([]);
      toast.error("Failed to fetch departments");
    }
  };

  // topics for college + department (returns topics array with topic_id)
  const fetchTopicsForCollegeDepartment = async (collegeId, departmentId) => {
    if (!collegeId || !departmentId) {
      setTopics([]);
      return;
    }
    try {
      // endpoint you said earlier; make sure backend route exists:
      const res = await fetch(
        `${API_BASE}/colleges/${collegeId}/departments/${departmentId}/topics`
      );
      if (!res.ok) throw new Error("Failed to fetch topics");
      const data = await res.json();
      // expected data.data = array of topics { topic_id, topic_name, ... }
      setTopics(data.data || []);
    } catch (e) {
      console.error(e);
      setTopics([]);
    }
  };

  useEffect(() => {
    // initial load
    fetchColleges();
    fetchAssignments();
    fetchOverviewDetails();
    fetchTopicWithSubTopic();
  }, []);

  // when selection changes: departments & topics
  useEffect(() => {
    fetchDepartmentsForCollege(formData.assignmentCollege, setAssignmentDepartments);
  }, [formData.assignmentCollege]);

  useEffect(() => {
    fetchDepartmentsForCollege(formData.topicSelectionCollege, setOverviewDepartments);
  }, [formData.topicSelectionCollege]);

  useEffect(() => {
    fetchDepartmentsForCollege(formData.mcqCollege, setMcqDepartments);
  }, [formData.mcqCollege]);

  // topics for overview & mcq
  useEffect(() => {
    fetchTopicsForCollegeDepartment(formData.topicSelectionCollege, formData.topicSelectionDepartment);
  }, [formData.topicSelectionCollege, formData.topicSelectionDepartment]);

  useEffect(() => {
    fetchTopicsForCollegeDepartment(formData.mcqCollege, formData.mcqDepartment);
  }, [formData.mcqCollege, formData.mcqDepartment]);

  // helper to map to react-select options
  const mapOptions = (arr, valueKey, labelKey) =>
    (arr || []).map((x) => ({ value: x[valueKey], label: x[labelKey], raw: x }));

  // Assignment submit
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("test_type", "assignment");
      fd.append("college_id", formData.assignmentCollege);
      fd.append("department_id", formData.department);
      fd.append("assignment_number", formData.assignmentNo);
      fd.append("assignment_topic", formData.assignmentTopic);
      fd.append("start_date", formData.startDate);
      fd.append("end_date", formData.endDate || "");
      if (formData.file) fd.append("file", formData.file);

      const res = await fetch(`${API_BASE}/tests/create`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Assignment uploaded successfully!");
      fetchAssignments();
      // reset partial fields
      setFormData((p) => ({ ...p, assignmentNo: "", assignmentTopic: "", file: null, startDate: "", endDate: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload assignment");
    }
  };

  // Overview submit: send college_id, department_id, topic_id (and topic_name to be safe), sub-topic, content
  const handleOverviewSubmit = async (e) => {
    e.preventDefault();

    if (!formData.overviewVideo && !formData.overviewDocument && !formData.overviewText) {
      toast.error("Please provide at least one of Overview Video, Document or Text.");
      return;
    }

    if (!formData.topicSelectionCollege || !formData.topicSelectionDepartment || !formData.topicId) {
      toast.error("Please select College, Department and Topic.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("college_id", formData.topicSelectionCollege);
      fd.append("department_id", formData.topicSelectionDepartment);
      fd.append("topic_id", formData.topicId);
      const topic = topics.find((t) => String(t.topic_id) === String(formData.topicId));
      fd.append("topic_name", topic?.topic_name || "");
      fd.append("sub_topic_name", formData.subTopicName);
      fd.append("no_of_sub_topics", formData.noOfSubTopic || 0);
      fd.append("video_link", formData.overviewVideo || "");
      fd.append("overview_content", formData.overviewText || "");
      // fd.append("sub_topic_id", formData.subTopicId || "");
      

      if (formData.overviewDocument) fd.append("file", formData.overviewDocument);

      const res = await fetch(`${API_BASE}/overviews/upload`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success("Overview uploaded successfully!");
      // reset fields
      setFormData((p) => ({
        ...p,
        topicSelectionCollege: "",
        topicSelectionDepartment: "",
        topicId: "",
        subTopicName: "",
        noOfSubTopic: "",
        overviewVideo: "",
        subTopicId: "",
        overviewDocument: null,
        overviewText: "",
      }));
      fetchOverviewDetails();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload overview");
    }
  };

  // MCQ submit
  const handleMcqSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mcqFile) {
      toast.error("Please upload MCQ file.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("test_type", "sub_topic");
      fd.append("college_id", formData.mcqCollege);
      fd.append("department_id", formData.mcqDepartment || "");
      fd.append("topic_id", formData.mcqTopicId || "");
      const selTopic = topics.find((t) => String(t.topic_id) === String(formData.mcqTopicId));
      fd.append("topic_name", selTopic?.topic_name || "");
      fd.append("sub_topic_id", formData.mcqSubTopicId || "")
      fd.append("sub_topic_name", formData.mcqSubTopicName || "");
      fd.append("no_of_sub_topics", formData.mcqNoOfSubTopic || 0);
      fd.append("file", formData.mcqFile);
      fd.append("file_name", formData.mcqFile.name);

      const res = await fetch(`${API_BASE}/tests/create`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success("MCQ uploaded successfully!");
      setFormData((p) => ({ ...p, mcqFile: null, mcqSubTopicName: "", mcqNoOfSubTopic: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload MCQ");
    }
  };

  // derived rows for overview table (same as you had)
  const overviewRows = useMemo(() => {
    let serial = 1;
    return overviewDetails.reduce((acc, overview) => {
      const subRows = (overview.sub_topics || []).map((subTopic) => ({
        topicSerial: serial,
        topic_id: overview.topic_id,
        topic_name: overview.topic_name,
        sub_topic_name: subTopic.sub_topic_name,
        sub_topic_id: subTopic.sub_topic_id,
        overview_video_url: subTopic.overview_video_url,
        overview_content: subTopic.overview_content,
        progress: subTopic.progress || "85%",
      }));
      serial++;
      return [...acc, ...subRows];
    }, []);
  }, [overviewDetails]);

  // pagination handlers
  const assignmentTotal = assignmentData.length;
  const assignmentTotalPages = Math.max(1, Math.ceil(assignmentTotal / rowsPerPage));
  const overviewTotal = overviewRows.length;
  const overviewTotalPages = Math.max(1, Math.ceil(overviewTotal / rowsPerPage));

  const mcqTotalPages = Math.max(1, Math.ceil(topicWithSub.length / rowsPerPage));

  const handleMcqPrev = () => setMcqPage((p) => Math.max(1, p - 1));
  const handleMcqNext = () => setMcqPage((p) => Math.min(mcqTotalPages, p + 1));

  const handleAssignmentPrev = () => setAssignmentPage((p) => Math.max(1, p - 1));
  const handleAssignmentNext = () => setAssignmentPage((p) => Math.min(assignmentTotalPages, p + 1));
  const handleOverviewPrev = () => setOverviewPage((p) => Math.max(1, p - 1));
  const handleOverviewNext = () => setOverviewPage((p) => Math.min(overviewTotalPages, p + 1));

  // get subtopics for selected topic (from topics or topicWithSub)
  const getSubTopicsForTopic = (topicId) => {
    const t1 = topics.find((t) => String(t.topic_id) === String(topicId));
    if (t1 && t1.sub_topics) return t1.sub_topics;
    // fallback to topicWithSub if structure different
    const t2 = topicWithSub.find((t) => String(t.topic_id) === String(topicId));
    return t2?.sub_topics || [];
  };

  // simple formatting helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Jodit editor change
  const handleEditorChange = (newContent) => setField("overviewText", newContent);

  // modal to add global topic (if you still want create-topic flow)
  const handleAddTopic = async () => {
    if (!topicNameModal.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/topics/create-topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_name: topicNameModal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      toast.success("Topic created");
      setTopicNameModal("");
      setIsModalOpen(false);
      fetchTopicWithSubTopic();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create topic");
    }
  };

  // UI option creators
  const collegeOptions = mapOptions(colleges, "college_id", "name");
  const assignmentDeptOptions = mapOptions(assignmentDepartments, "department_id", "department_name");
  const overviewDeptOptions = mapOptions(overviewDepartments, "department_id", "department_name");
  const mcqDeptOptions = mapOptions(mcqDepartments, "department_id", "department_name");
  const topicOptions = mapOptions(topics, "topic_id", "topic_name");
  const mcqTopicOptions = topicOptions;

  return (
    <div className="p-4 lg:p-6 mt-30 min-h-screen">
      <ToastContainer />
      <div className="flex justify-center gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
        {[
          { id: "upload-assignment", label: "Upload Assignment" },
          { id: "upload-overview", label: "Upload Overview" },
          { id: "upload-questions", label: "Upload Questions" },
        ].map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] lg:min-w-0 ${selectedTab === tab.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
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

      {/* ASSIGNMENT */}
      {selectedTab === "upload-assignment" && (
        <>
          <form onSubmit={handleAssignmentSubmit} className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Fill the details to create an assignment</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select College</label>
              <Select
                options={collegeOptions}
                value={collegeOptions.find((o) => String(o.value) === String(formData.assignmentCollege)) || null}
                onChange={(opt) => setField("assignmentCollege", opt?.value || "")}
                placeholder="Select College"
                isClearable
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
                <Select
                  options={assignmentDeptOptions}
                  value={assignmentDeptOptions.find((o) => String(o.value) === String(formData.department)) || null}
                  onChange={(opt) => setField("department", opt?.value || "")}
                  placeholder="Select Department"
                  isDisabled={!formData.assignmentCollege}
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment No</label>
                <input
                  type="text"
                  name="assignmentNo"
                  value={formData.assignmentNo}
                  onChange={(e) => setField("assignmentNo", e.target.value)}
                  placeholder="Type assignment no"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Topic</label>
                <input
                  type="text"
                  name="assignmentTopic"
                  value={formData.assignmentTopic}
                  onChange={(e) => setField("assignmentTopic", e.target.value)}
                  placeholder="Type assignment topic"
                  required
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
                  onChange={(e) => setField("startDate", e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Ending Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                <div className="relative">
                  <input type="file" name="file" onChange={handleFileChange} required className="w-full" />
                </div>
                <p className="text-xs text-gray-500 mt-1">File Upload (doc 1mb)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <a href="/question_template.xlsx" download className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow">
                Download Template
              </a>
              <button type="submit" className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow">
                Upload Assignment
              </button>
            </div>
          </form>

          <AssignmentTable data={assignmentData} page={assignmentPage} rowsPerPage={rowsPerPage} total={assignmentData.length} totalPages={assignmentTotalPages} onPrev={handleAssignmentPrev} onNext={handleAssignmentNext} formatDate={formatDate} />
        </>
      )}

      {/* OVERVIEW */}
      {selectedTab === "upload-overview" && (
        <>
          <form onSubmit={handleOverviewSubmit} className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Fill the details to upload overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                <Select
                  options={collegeOptions}
                  value={collegeOptions.find((o) => String(o.value) === String(formData.topicSelectionCollege)) || null}
                  onChange={(opt) => {
                    setField("topicSelectionCollege", opt?.value || "");
                    // reset department/topic on college change
                    setField("topicSelectionDepartment", "");
                    setField("topicId", "");
                  }}
                  placeholder="Select College"
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <Select
                  options={overviewDeptOptions}
                  value={overviewDeptOptions.find((o) => String(o.value) === String(formData.topicSelectionDepartment)) || null}
                  onChange={(opt) => {
                    setField("topicSelectionDepartment", opt?.value || "");
                    setField("topicId", "");
                  }}
                  isDisabled={!formData.topicSelectionCollege}
                  placeholder="Select Department"
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
                <Select
                  options={topicOptions}
                  value={topicOptions.find((o) => String(o.value) === String(formData.topicId)) || null}
                  onChange={(opt) => setField("topicId", opt?.value || "")}
                  isDisabled={!formData.topicSelectionDepartment}
                  placeholder="Select Topic"
                  isClearable
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-Topic Name
                </label>

                <input
                  type="text"
                  value={formData.subTopicName || ""}
                  onChange={(e) => {
                    setField("subTopicName", e.target.value);
                    setField("subTopicId", null); // Not using ID since it's manual
                  }}
                  placeholder="Enter Sub-Topic Name"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. of Sub-Topics</label>
                <input type="number" name="noOfSubTopic" value={formData.noOfSubTopic} onChange={(e) => setField("noOfSubTopic", e.target.value)} placeholder="Type count" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overview Video (optional)</label>
                <input type="url" name="overviewVideo" value={formData.overviewVideo} onChange={(e) => setField("overviewVideo", e.target.value)} placeholder="Enter video URL" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overview Document (optional)</label>
                <input type="file" name="overviewDocument" onChange={handleFileChange} accept=".pdf,.docx" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>

            {formData.overviewText && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Extracted Text (Editable)</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: "300px", width: "100%" }}>
                  <JoditEditor ref={editor} value={formData.overviewText} config={{ readonly: false, height: 300 }} onBlur={handleEditorChange} onChange={handleEditorChange} />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow">
                Upload Overview
              </button>
            </div>
          </form>

          <OverviewTable data={overviewRows} page={overviewPage} rowsPerPage={rowsPerPage} total={overviewRows.length} totalPages={overviewTotalPages} onPrev={handleOverviewPrev} onNext={handleOverviewNext} />
        </>
      )}

      {/* MCQ */}
      {selectedTab === "upload-questions" && (
        <>
          <form onSubmit={handleMcqSubmit} className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-4 lg:mb-6">Fill the details to Upload Questions</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                <Select options={collegeOptions} value={collegeOptions.find((o) => String(o.value) === String(formData.mcqCollege)) || null} onChange={(opt) => { setField("mcqCollege", opt?.value || ""); setField("mcqDepartment", ""); setField("mcqTopicId", ""); }} placeholder="Select College" isClearable />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <Select options={mcqDeptOptions} value={mcqDeptOptions.find((o) => String(o.value) === String(formData.mcqDepartment)) || null} onChange={(opt) => { setField("mcqDepartment", opt?.value || ""); setField("mcqTopicId", ""); }} isDisabled={!formData.mcqCollege} placeholder="Select Department" isClearable />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic Name</label>
                <Select options={mcqTopicOptions} value={mcqTopicOptions.find((o) => String(o.value) === String(formData.mcqTopicId)) || null} onChange={(opt) => setField("mcqTopicId", opt?.value || "")} isDisabled={!formData.mcqDepartment} placeholder="Select Topic" isClearable />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub - Topic Name</label>
                <Select
                  options={mapOptions(
                    getSubTopicsForTopic(formData.mcqTopicId),
                    "sub_topic_id",
                    "sub_topic_name"
                  )}
                  value={
                    mapOptions(
                      getSubTopicsForTopic(formData.mcqTopicId),
                      "sub_topic_id",
                      "sub_topic_name"
                    ).find((o) => String(o.value) === String(formData.mcqSubTopicId)) || null
                  }
                  onChange={(opt) => {
                    setField("mcqSubTopicId", opt?.value || "");
                    setField("mcqSubTopicName", opt?.label || "");
                  }}
                  placeholder="Select Sub-Topic"
                  isDisabled={!formData.mcqTopicId}
                  isClearable
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MCQ's File Upload</label>
                <div className="relative">
                  <input type="file" name="mcqFile" onChange={handleFileChange} accept=".xlsx,.xls" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <p className="text-xs text-gray-500 mt-1">File Upload (xls or xlsx, 2mb)</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <a href="/question_template.xlsx" download className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow">
                Download Template
              </a>
              <button type="submit" className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-shadow">
                Upload Questions
              </button>
            </div>
          </form>

          <McqTable
            data={topicWithSub}
            page={mcqPage}
            rowsPerPage={rowsPerPage}
            total={topicWithSub.length}
            totalPages={mcqTotalPages}
            onPrev={handleMcqPrev}
            onNext={handleMcqNext}
          />
        </>
      )}

      {/* Modal: Add Topic */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-80">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Add New Topic</h3>
            <input type="text" value={topicNameModal} onChange={(e) => setTopicNameModal(e.target.value)} placeholder="Enter topic name" className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="px-3 py-1 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800">Cancel</button>
              <button onClick={handleAddTopic} className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;
