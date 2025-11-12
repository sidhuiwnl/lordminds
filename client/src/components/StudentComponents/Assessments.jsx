import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecordRTC from "recordrtc";
import { ToastContainer, toast } from "react-toastify";

const Assessments = () => {
  const { subtopic } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [heading, setHeading] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState({});
  const [feedback, setFeedback] = useState("");
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const recorderRef = useRef(null);

  const totalSteps = questions.length;
  const API_URL = import.meta.env.VITE_BACKEND_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.user_id;

  // 🔁 Retry wrapper (exponential backoff)
  const retryFetch = async (fetchFn, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFn();
      } catch (err) {
        if (attempt === maxRetries) throw err;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  // 🧭 Fetch Questions + Subtopic
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await retryFetch(async () => {
          const response = await fetch(`${API_URL}/users/subtopic/${subtopic}/questions`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response;
        });

        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          const parsed = data.data.map((q) => ({
            ...q,
            question_data: JSON.parse(q.question_data || "{}"),
          }));
          setQuestions(parsed);
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchSubTopicDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/users/subtopic/${subtopic}`);
        const data = await res.json();
        setHeading(data.data.sub_topic_name);
      } catch (err) {
        console.error("Error fetching subtopic details:", err);
      }
    };

    if (subtopic) {
      fetchQuestions();
      fetchSubTopicDetails();
    }
  }, [subtopic, API_URL]);

  const currentQuestion = questions[currentStep - 1];

  // 🕒 Start Session
  useEffect(() => {
    if (!userId || sessionEnded) return;
    const startSession = async () => {
      try {
        const res = await fetch(`${API_URL}/tests/start/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: parseInt(userId) }),
        });
        const data = await res.json();
        if (data.status === "success") {
          setSessionId(data.session_id);
          console.log("✅ Session started:", data.session_id);
        }
      } catch (err) {
        console.error("Error starting session:", err);
      }
    };
    startSession();
  }, [userId, subtopic, API_URL]);

  const endSession = async () => {
    if (!sessionId || sessionEnded) return;
    try {
      await fetch(`${API_URL}/tests/end/${sessionId}`, { method: "PUT" });
      console.log("✅ Session ended:", sessionId);
      setSessionEnded(true);
    } catch (err) {
      console.error("Error ending session:", err);
    }
  };

  // 🎤 Audio Recording
  const startRecording = async () => {
    setFeedback("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });
      recorder.startRecording();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setFeedback("⚠️ Please allow microphone access.");
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      await recorderRef.current.stopRecording(async () => {
        const blob = recorderRef.current.getBlob();
        setRecording(false);
        setAnswers((prev) => ({ ...prev, [`audio-${currentQuestion.question_id}`]: blob }));

        if (window.speechSynthesis) {
          const utter = new SpeechSynthesisUtterance("Analyzing your answer");
          utter.lang = "en-US";
          utter.rate = 1;
          speechSynthesis.speak(utter);
        }

        await sendAudioForAnalysis(blob);
      });
    } catch (err) {
      console.error("Error stopping recording:", err);
    }
  };

  // 🧠 Analyze Audio
  const sendAudioForAnalysis = async (audioBlob) => {
    setAnalyzing(true);
    setFeedback("🔄 Analyzing Audio...");
    const formData = new FormData();
    formData.append("file", audioBlob, "response.wav");

    try {
      const res = await retryFetch(async () => {
        const response = await fetch(`${API_URL}/users/analyze-voice`, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
      });

      const result = await res.json();
      const qid = currentQuestion.question_id;
      setAnalysisResults((prev) => ({ ...prev, [qid]: result }));

      const expectedAnswer =
        currentQuestion?.question_data?.correct_answer?.toString().toLowerCase() || "";

      // ✅ Handle nested "data" structure
      const transcript =
        result?.data?.transcription?.toLowerCase?.() ||
        result?.transcription?.toLowerCase?.() ||
        "";

      // ⚠️ Handle “Could not understand”
      if (transcript.includes("could not understand")) {
        setFeedback("⚠️ Could not understand your answer. Try again.");
        speechSynthesis.speak(
          new SpeechSynthesisUtterance("Could not understand your answer, please try again.")
        );
        return;
      }

      // ✅ Evaluate correctness
      if (expectedAnswer && transcript.includes(expectedAnswer)) {
        setFeedback("✅ Correct Answer!");
        setAnalysisResults((prev) => ({
          ...prev,
          [qid]: { ...result, correctness: "correct" },
        }));
        setAnswers((prev) => ({ ...prev, [`completed-${qid}`]: true }));
        speechSynthesis.speak(new SpeechSynthesisUtterance("Correct answer"));
        setTimeout(() => handleNext(), 1500);
      } else {
        setFeedback("❌ Incorrect Answer.");
        setAnalysisResults((prev) => ({
          ...prev,
          [qid]: { ...result, correctness: "wrong" },
        }));
        speechSynthesis.speak(new SpeechSynthesisUtterance("Wrong answer"));
      }
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setFeedback("⚠️ Error analyzing audio. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptionChange = (option) => {
    setAnswers({ ...answers, [currentQuestion.question_id]: option });
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(option);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    setFeedback("");
  };

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    setFeedback("");
  };

  const calculateScore = () => {
    let marksObtained = 0;
    questions.forEach((q) => {
      const analysis = analysisResults[q.question_id];
      if (analysis?.correctness === "correct") marksObtained++;
    });
    return { marks_obtained: marksObtained, max_marks: questions.length };
  };

  const handleSubmitTest = async () => {
    const score = calculateScore();
    try {
      const res = await fetch(`${API_URL}/student/store-marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: parseInt(userId),
          sub_topic_id: parseInt(subtopic),
          marks_obtained: score.marks_obtained,
          max_marks: score.max_marks,
        }),
      });

      const data = await res.json();
      if (data.status === "success") {
        await endSession();
        toast.success(
          `✅ Test Completed! You scored ${score.marks_obtained}/${score.max_marks}`
        );
        navigate("/student/studenthome");
      }
    } catch (err) {
      console.error("Error submitting test:", err);
      toast.error("Error completing test. Please try again.");
    }
  };

  if (loading)
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading questions...</div>;
  if (error)
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  if (questions.length === 0)
    return <div className="flex justify-center items-center h-screen text-gray-600">No questions found for this subtopic.</div>;

  const isNavigationDisabled = recording || analyzing;

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <ToastContainer />
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6]">
        <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4">{heading}</h2>

        <p className="text-sm font-medium text-gray-700 mb-4">
          {currentStep}. {currentQuestion.question_text}
        </p>

        {/* MCQ Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.question_data?.options?.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            const isSelected = answers[currentQuestion.question_id] === option;
            return (
              <label
                key={index}
                className={`flex items-center space-x-3 cursor-pointer p-3 border rounded-lg transition-colors ${
                  isSelected ? "bg-yellow-100 border-yellow-400" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name={`answer-${currentQuestion.question_id}`}
                  value={option}
                  checked={isSelected}
                  onChange={() => handleOptionChange(option)}
                  className="hidden"
                />
                <span className="text-sm text-gray-700">
                  <strong>{optionLetter}:</strong> {option.toString()}
                </span>
              </label>
            );
          })}
        </div>

        {/* 🎤 Audio Controls */}
        <div className="flex items-center gap-3 mb-6">
          {!recording ? (
            <button
              onClick={startRecording}
              disabled={analyzing}
              className="px-4 py-2 bg-[#1b65a6] text-white rounded-full hover:bg-blue-700 transition"
            >
              {analyzing ? "Analyzing..." : "Start Recording"}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            >
              Stop Recording
            </button>
          )}
        </div>

        {feedback && (
          <p
            className={`mt-2 text-base font-semibold ${
              feedback.includes("✅")
                ? "text-green-600"
                : feedback.includes("❌")
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {feedback}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || isNavigationDisabled}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition"
          >
            ‹
          </button>

          {questions.map((q, i) => {
            const qNum = i + 1;
            const qId = q.question_id;
            const isActive = currentStep === qNum;
            const correctness = analysisResults[qId]?.correctness;
            const color =
              correctness === "correct"
                ? "bg-green-400"
                : correctness === "wrong"
                ? "bg-red-400"
                : "bg-gray-300";

            return (
              <button
                key={qNum}
                onClick={() => {
                  if (!isNavigationDisabled) {
                    setCurrentStep(qNum);
                    setFeedback("");
                  }
                }}
                disabled={isNavigationDisabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  isActive ? "ring-2 ring-yellow-400" : ""
                } ${color}`}
              >
                {qNum}
              </button>
            );
          })}

          <button
            onClick={handleNext}
            disabled={currentStep === totalSteps || isNavigationDisabled}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition"
          >
            ›
          </button>
        </div>

        {/* ✅ Submit Button */}
        {currentStep === totalSteps && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmitTest}
              disabled={sessionEnded || isNavigationDisabled}
              className={`px-6 py-2 rounded-lg transition ${
                !sessionEnded && !isNavigationDisabled
                  ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300 cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {sessionEnded ? "Submitting..." : "Submit Test"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessments;
