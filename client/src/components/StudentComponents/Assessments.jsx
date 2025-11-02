import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecordRTC from "recordrtc";
import { ToastContainer,toast } from "react-toastify";

const Assessments = () => {
  const { subtopic } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [heading, setHeading] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const recorderRef = useRef(null);

  const totalSteps = questions.length;
  const API_URL = import.meta.env.VITE_BACKEND_API_URL;

  // 🧠 Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.user_id;

  // ===============================
  // 🚀 Fetch questions + subtopic
  // ===============================
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/users/subtopic/${subtopic}/questions`);
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

  // ===============================
  // 🕒 Handle Session Start / End
  // ===============================
  useEffect(() => {
    if (!userId || sessionEnded) return;

    let isMounted = true;

    const startSession = async () => {
      try {
        const res = await fetch(`${API_URL}/tests/start/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id : parseInt(userId) }), // Include subtopic if backend supports
        });
        const data = await res.json();
        if (data.status === "success" && isMounted) {
          setSessionId(data.session_id);
          console.log("✅ Session started:", data.session_id);
        }
      } catch (err) {
        console.error("Error starting session:", err);
      }
    };

    startSession();

    // NO CLEANUP HERE: We don't auto-end on unmount/reload. Only end on explicit submit.
    // If user reloads, a new session starts, and old one remains open (end_time NULL).
    // Backend can handle stale sessions later if needed (e.g., via cron job).
  }, [userId, subtopic, API_URL]);  // Removed sessionId/sessionEnded from deps to avoid re-runs

  const endSession = async () => {
    if (!sessionId || sessionEnded) return;
    try {
      await fetch(`${API_URL}/tests/end/${sessionId}`, {
        method: "PUT",
      });
      console.log("✅ Session ended:", sessionId);
      setSessionEnded(true);
    } catch (err) {
      console.error("Error ending session:", err);
    }
  };

  // ===============================
  // 🎤 Audio Recording
  // ===============================
  const startRecording = async () => {
    setAnalysisResult(null);
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
      setFeedback("⚠️ Microphone access denied. Please allow and try again.");
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      await recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        setAnswers({ ...answers, [`audio-${currentQuestion.question_id}`]: blob });
        setRecording(false);
        // Stop the stream to release microphone
        recorderRef.current.getDataURL((dataURL) => {
          // Optional: Handle dataURL if needed
        });
      });
    } catch (err) {
      console.error("Error stopping recording:", err);
    }
  };

  const sendAudioForAnalysis = async () => {
    const audioBlob = answers[`audio-${currentQuestion.question_id}`];
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("file", audioBlob, "response.wav");

    try {
      const res = await fetch(`${API_URL}/users/analyze-voice`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      setAnalysisResult(result);

      const expectedAnswer =
        currentQuestion?.question_data?.correct_answer?.toString().toLowerCase() || "";
      const transcript = result?.transcription?.toLowerCase() || "";

      if (transcript === "could not understand the audio.") {
        setFeedback("⚠️ Could not understand your answer. Try again.");
      } else if (expectedAnswer && transcript.includes(expectedAnswer)) {
        setFeedback("✅ Correct Answer!");
      } else {
        setFeedback("❌ Incorrect Answer.");
      }
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setAnalysisResult({ error: "Failed to analyze audio" });
      setFeedback("⚠️ Error analyzing audio. Try again.");
    }
  };

  // ===============================
  // 🧭 Navigation
  // ===============================
  const handleOptionChange = (option) => {
    setAnswers({ ...answers, [currentQuestion.question_id]: option });
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    setAnalysisResult(null);
    setFeedback("");
  };

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    setAnalysisResult(null);
    setFeedback("");
  };

  // ===============================
  // 🏁 Submit Test (End Session) - UPDATED
  // ===============================
  const calculateScore = () => {
    let marksObtained = 0;
    
    questions.forEach(question => {
      const userAnswer = answers[question.question_id];
      const correctAnswer = question.question_data?.correct_answer;
      
      // For text/MCQ questions - each correct answer = 1 mark
      if (userAnswer && correctAnswer !== undefined) {
        if (userAnswer === correctAnswer) {
          marksObtained += 1;
        }
      }
      
      // For audio questions - each correct answer = 1 mark
      const audioAnswer = answers[`audio-${question.question_id}`];
      if (audioAnswer && analysisResult?.transcription) {
        const expectedAnswer = question.question_data?.correct_answer?.toString().toLowerCase() || "";
        const transcript = analysisResult.transcription.toLowerCase();
        if (transcript.includes(expectedAnswer) && expectedAnswer !== "") {
          marksObtained += 1;
        }
      }
    });
    
    return {
      marks_obtained: marksObtained,
      max_marks: questions.length,
      percentage: (marksObtained / questions.length) * 100
    };
  };

  const handleSubmitTest = async () => {
    if (!sessionId) {
      toast("Session not started. Please refresh and try again.");
      return;
    }
    
    try {
      // 1. Calculate score (each question = 1 mark)
      const score = calculateScore();
      
      // 2. Store marks in database
      const marksResponse = await fetch(`${API_URL}/student/store-marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: parseInt(userId),
          sub_topic_id: parseInt(subtopic), // assuming subtopic is the ID
          marks_obtained: score.marks_obtained,
          max_marks: score.max_marks
        })
      });
      
      const marksData = await marksResponse.json();
      
      if (marksData.status === "success") {
        // 3. End session
        await endSession();
        
        // 4. Show success message with marks
        toast.success(`✅ Test Completed! You scored ${score.marks_obtained}/${score.max_marks}`);
        
        // 5. Navigate to home
        navigate("/student/studenthome");
      } else {
        throw new Error("Failed to store marks");
      }
      
    } catch (err) {
      console.error("Error submitting test:", err);
      toast.error("Error completing test. Please try again.");
    }
  };

  // ===============================
  // ⚙️ UI States
  // ===============================
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading questions...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );

  if (questions.length === 0)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        No questions found for this subtopic.
      </div>
    );

  // ===============================
  // 🖥️ Main Render
  // ===============================
  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <ToastContainer/>
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
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
                    <strong>{optionLetter}:</strong>{" "}
                    {typeof option === "boolean" ? option.toString() : option}
                  </span>
                </label>
              );
            })}
          </div>

          {/* 🎙 Audio Controls */}
          <div className="flex items-center gap-3 mb-6">
            {!recording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-[#1b65a6] text-white rounded-full hover:bg-blue-700 transition"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              >
                Stop Recording
              </button>
            )}

            {answers[`audio-${currentQuestion.question_id}`] && (
              <button
                onClick={sendAudioForAnalysis}
                className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
              >
                Analyze Answer
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

          {/* Navigation + Submit */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition"
            >
              ‹
            </button>

            {questions.map((_, index) => {
              const qNum = index + 1;
              const isActive = currentStep === qNum;
              const isAnswered = answers[questions[index].question_id];

              return (
                <button
                  key={qNum}
                  onClick={() => {
                    setCurrentStep(qNum);
                    setAnalysisResult(null);
                    setFeedback("");
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    isActive
                      ? "bg-yellow-400 text-gray-900"
                      : isAnswered
                      ? "bg-green-400 text-gray-900"
                      : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                  }`}
                >
                  {qNum}
                </button>
              );
            })}

            <button
              onClick={handleNext}
              disabled={currentStep === totalSteps}
              className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition"
            >
              ›
            </button>
          </div>

          {/* ✅ Submit Button (Only at Last Question) */}
          {currentStep === totalSteps && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleSubmitTest}
                disabled={sessionEnded}
                className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition disabled:opacity-50"
              >
                {sessionEnded ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assessments;