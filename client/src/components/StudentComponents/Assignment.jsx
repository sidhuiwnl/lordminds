import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecordRTC from "recordrtc";
import { ToastContainer, toast } from "react-toastify";

const Assignments = () => {
  const { assignment } = useParams();
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
  const [attemptCounts, setAttemptCounts] = useState({});
  const [showCorrectAnswer, setShowCorrectAnswer] = useState({});
  const recorderRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [originalQuestions, setOriginalQuestions] = useState([]);


  const totalSteps = questions.length;
  const API_URL = import.meta.env.VITE_BACKEND_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.user_id;

  // ✅ Retry function (exponential backoff)
  const retryFetch = async (fetchFn, maxRetries = 2, baseDelay = 1000) => {
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

  useEffect(() => {
    /* -----------------------------------------------
       1. Prevent PrintScreen (Clear Clipboard)
    ------------------------------------------------ */
    const handlePrintScreen = async (e) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText("");
        } catch (_) { }
        toast.error("⚠️ Screenshot attempt blocked!");
        document.body.style.filter = "blur(50px)";
        setTimeout(() => (document.body.style.filter = "none"), 1500);
      }
    };

    /* -----------------------------------------------
       2. Disable Copy / Cut / Select
    ------------------------------------------------ */
    const preventCopy = (e) => {
      e.preventDefault();
      toast.error("⚠️ Copying is disabled.");
    };

    const preventSelect = (e) => {
      e.preventDefault();
      toast.error("⚠️ Text selection is disabled.");
      return false;
    };

    /* -----------------------------------------------
       3. Disable Right Click
    ------------------------------------------------ */
    const preventRightClick = (e) => {
      e.preventDefault();
      toast.error("⚠️ Right-click disabled.");
    };

    /* -----------------------------------------------
       4. Block Dangerous Keyboard Shortcuts
    ------------------------------------------------ */
    const blockKeys = (e) => {
      const key = e.key.toLowerCase();

      // Ctrl + P/U/S and DevTools
      if (
        (e.ctrlKey && ["p", "u", "s"].includes(key)) ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
        toast.error("⚠️ This action is disabled.");
      }
    };

    /* -----------------------------------------------
       5. Detect Tab Switching / Window Blur
    ------------------------------------------------ */
    const onBlur = () => {
      document.body.style.filter = "blur(50px)";
      toast.error("⚠️ Stay on the assignment window!");
    };

    const onFocus = () => {
      document.body.style.filter = "none";
    };

    /* -----------------------------------------------
       6. Detect Screen Capture Tools (Snipping Tool)
    ------------------------------------------------ */
    const snipDetection = setInterval(() => {
      if (document.hidden || !document.hasFocus()) {
        document.body.style.filter = "blur(50px)";
        toast.error("⚠️ Screen capturing detected!");
      }
    }, 500);

    /* -----------------------------------------------
       7. Add all listeners once
    ------------------------------------------------ */
    window.addEventListener("keyup", handlePrintScreen);
    window.addEventListener("keydown", blockKeys);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("selectstart", preventSelect);
    document.addEventListener("contextmenu", preventRightClick);

    /* -----------------------------------------------
       Cleanup listeners on unmount
    ------------------------------------------------ */
    return () => {
      window.removeEventListener("keyup", handlePrintScreen);
      window.removeEventListener("keydown", blockKeys);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);

      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("selectstart", preventSelect);
      document.removeEventListener("contextmenu", preventRightClick);

      clearInterval(snipDetection);
    };
  }, []);

  useEffect(() => {
    const enterFullscreen = () => document.documentElement.requestFullscreen();
    enterFullscreen();

    const onFSChange = () => {
      if (!document.fullscreenElement) {
        toast.error("⚠️ Fullscreen required! Exiting exam...");
        navigate("/student/studenthome");
      }
    };

    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);


  // ✅ Fetch Questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await retryFetch(async () => {
          const response = await fetch(`${API_URL}/assignments/get/${assignment}/questions`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response;
        });
        const data = await res.json();

        if (Array.isArray(data)) {
          const parsed = data.map((q) => ({
            ...q,
            question_data:
              typeof q.question_data === "string"
                ? JSON.parse(q.question_data || "{}")
                : q.question_data || {},
          }));
          setOriginalQuestions(parsed);
          setHeading(parsed[0]?.assignment_heading || "Assignment");

          // Initialize attempt counts and showCorrectAnswer state
          const initialAttempts = {};
          const initialShowAnswer = {};
          parsed.forEach(q => {
            initialAttempts[q.question_id] = 0;
            initialShowAnswer[q.question_id] = false;
          });
          setAttemptCounts(initialAttempts);
          setShowCorrectAnswer(initialShowAnswer);

          if (!sessionId && !sessionEnded) await startSession();
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError(err.message);
        toast.error("Failed to load questions. Retrying...");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [assignment, API_URL, sessionId, sessionEnded]);

  const currentQuestion = questions[currentStep - 1];

  // ✅ Start Session
  const startSession = async () => {
    if (!userId || sessionEnded) return;
    try {
      const res = await retryFetch(async () => {
        const response = await fetch(`${API_URL}/tests/start/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: parseInt(userId) }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
      });
      const data = await res.json();
      if (data.status === "success") {
        setSessionId(data.session_id);
        console.log("✅ Assignment session started:", data.session_id);
      } else {
        console.error("Failed to start session:", data.message);
      }
    } catch (err) {
      console.error("Error starting session:", err);
      toast.error("Failed to start session. Please refresh and try again.");
    }
  };



  // PERFECT RANDOM SHUFFLE — Fixed & Production Ready
  useEffect(() => {
    if (originalQuestions.length === 0) return;

    const orderKey = `assignment_${assignment}_order_v3`;
    const saved = localStorage.getItem(orderKey);
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;

    // 🔹 Use saved order if recent
    if (saved) {
      try {
        const { order, timestamp } = JSON.parse(saved);
        if (now - timestamp < twoHours) {
          const ordered = order
            .map(id => originalQuestions.find(q => q.question_id === id))
            .filter(Boolean);

          if (ordered.length === originalQuestions.length) {
            setQuestions(ordered);
            return;
          }
        }
      } catch (e) {
        console.warn("Corrupt order, resetting...");
      }
    }

    // 🔹 Create new shuffle
    const shuffled = [...originalQuestions].sort(() => Math.random() - 0.5);

    setQuestions(shuffled);

    localStorage.setItem(orderKey, JSON.stringify({
      order: shuffled.map(q => q.question_id),
      timestamp: now
    }));

  }, [originalQuestions]);


  // ✅ End Session
  const endSession = async () => {
    if (!sessionId || sessionEnded) return;
    try {
      await retryFetch(async () => {
        const response = await fetch(`${API_URL}/tests/end/${sessionId}`, { method: "PUT" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
      });
      console.log("✅ Assignment session ended:", sessionId);
      setSessionEnded(true);
    } catch (err) {
      console.error("Error ending session:", err);
      toast.error("Failed to end session.");
    }
  };

  // 🎤 Start Recording
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
      toast.error("Microphone access denied. Please enable and try again.");
    }
  };

  // 🎤 Stop Recording → Analyze
  const stopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      await recorderRef.current.stopRecording(async () => {
        const blob = recorderRef.current.getBlob();
        setRecording(false);
        setAnswers((prev) => ({ ...prev, [`audio-${currentQuestion.question_id}`]: blob }));

        // Stop the media stream
        if (recorderRef.current.stream) {
          recorderRef.current.stream.getTracks().forEach(track => track.stop());
        }

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
      setRecording(false);
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

      // Increment attempt count for this question
      const newAttemptCount = (attemptCounts[qid] || 0) + 1;
      setAttemptCounts(prev => ({
        ...prev,
        [qid]: newAttemptCount
      }));

      setAnalysisResults((prev) => ({ ...prev, [qid]: result }));

      const expectedAnswer =
        currentQuestion?.question_data?.correct_answer?.toString().toLowerCase() || "";

      const transcript =
        result?.data?.transcription?.toLowerCase?.() ||
        result?.transcription?.toLowerCase?.() ||
        "";

      // ⚠️ Handle "Could not understand"
      if (transcript.includes("could not understand")) {
        setFeedback("⚠️ Could not understand your answer. Please try speaking clearly.");
        speechSynthesis.speak(
          new SpeechSynthesisUtterance("Could not understand your answer, please try again.")
        );
        return;
      }

      // ✅ Evaluate correctness with fuzzy matching
      const isCorrect = checkAnswerCorrectness(transcript, expectedAnswer);

      if (isCorrect) {
        setFeedback("✅ Correct Answer!");
        setAnalysisResults((prev) => ({
          ...prev,
          [qid]: { ...result, correctness: "correct" },
        }));
        setAnswers((prev) => ({ ...prev, [`completed-${qid}`]: true }));
        speechSynthesis.speak(new SpeechSynthesisUtterance("Correct answer"));

        // Mark question as completed and show next button
        setAnswers(prev => ({ ...prev, [`show-next-${qid}`]: true }));

      } else {
        // Wrong answer logic
        if (newAttemptCount >= 2) {
          // After 2 wrong attempts, show correct answer and enable next button
          setFeedback(`❌ Incorrect Answer. The correct answer is: ${expectedAnswer}`);
          setShowCorrectAnswer(prev => ({ ...prev, [qid]: true }));
          setAnswers(prev => ({ ...prev, [`show-next-${qid}`]: true }));
          speechSynthesis.speak(new SpeechSynthesisUtterance(`Wrong answer. The correct answer is ${expectedAnswer}`));
        } else {
          // First wrong attempt
          setFeedback(`❌ Incorrect Answer. Try again. Attempt ${newAttemptCount}/2`);
          setAnalysisResults((prev) => ({
            ...prev,
            [qid]: { ...result, correctness: "wrong" },
          }));
          speechSynthesis.speak(new SpeechSynthesisUtterance("Wrong answer, please try again"));
        }
      }
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setFeedback("⚠️ Error analyzing audio. Please try again.");
      toast.error("Analysis failed. Please check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Fuzzy matching for answer correctness
  const checkAnswerCorrectness = (transcript, expectedAnswer) => {
    if (!expectedAnswer) return false;

    // Exact match
    if (transcript.includes(expectedAnswer)) return true;

    // Common variations
    const variations = {
      "present": ["present tense"],
      "past": ["past tense"],
      "future": ["future tense"],
      "continuous": ["continuous tense", "progressive"],
      "perfect": ["perfect tense"]
    };

    if (variations[expectedAnswer]) {
      return variations[expectedAnswer].some(variant => transcript.includes(variant));
    }

    return false;
  };

  // 🗣 Speak only option text (no correctness)
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
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setFeedback("");
    }
  };

  const calculateScore = () => {
    let marksObtained = 0;
    questions.forEach((q) => {
      const analysis = analysisResults[q.question_id];
      if (analysis?.correctness === "correct") marksObtained++;
    });
    return { marks_obtained: marksObtained, max_marks: questions.length };
  };

  const handleSubmit = async () => {
    const score = calculateScore();

    // Confirm submission
    if (!window.confirm("Are you sure you want to submit? You cannot re-attempt this assignment.")) {
      return;
    }

    try {
      const res = await retryFetch(async () => {
        const response = await fetch(`${API_URL}/student/store-assignment-marks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: parseInt(userId),
            assignment_id: parseInt(assignment),
            marks_obtained: score.marks_obtained,
            max_marks: score.max_marks,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
      });
      const data = await res.json();
      if (data.status === "success") {
        await endSession();
        toast.success(
          `✅ Assignment Completed! You scored ${score.marks_obtained}/${score.max_marks}`
        );

        localStorage.removeItem(`assignment_${assignment}_order_v3`);

        navigate("/student/studenthome");
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);
      toast.error("Error submitting assignment. Try again.");
    }
  };

  if (loading)
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading questions...</div>;
  if (error)
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  if (questions.length === 0)
    return <div className="flex justify-center items-center h-screen text-gray-600">No questions found.</div>;

  const isNavigationDisabled = recording || analyzing;
  const currentQuestionId = currentQuestion.question_id;
  const showNextButton = answers[`show-next-${currentQuestionId}`];
  const allQuestionsCompleted = questions.every(q => answers[`show-next-${q.question_id}`]);

  return (
    <div className="p-4 lg:p-6 bg-gray-50 mt-30 min-h-screen">
      <ToastContainer />

      {/* Assignment Header */}
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800">{heading || "Assignment"}</h2>
          <div className="text-sm text-gray-500">
            Question {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Current Question */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-4">
            {currentStep}. {currentQuestion.question_text}
          </p>

          {/* MCQ Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.question_data?.options?.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index);
              const isSelected = answers[currentQuestionId] === option;
              return (
                <label
                  key={index}
                  className={`flex items-center space-x-3 cursor-pointer p-3 border rounded-lg transition-colors ${isSelected ? "bg-yellow-100 border-yellow-400" : "hover:bg-gray-50"
                    } ${isNavigationDisabled || showNextButton ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name={`answer-${currentQuestionId}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => !isNavigationDisabled && !showNextButton && handleOptionChange(option)}
                    className="hidden"
                    disabled={isNavigationDisabled || showNextButton}
                  />
                  <span className="text-sm text-gray-700">
                    <strong>{optionLetter}:</strong> {option.toString()}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Show correct answer if revealed */}
          {showCorrectAnswer[currentQuestionId] && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-semibold">
                💡 Correct Answer: {currentQuestion?.question_data?.correct_answer}
              </p>
            </div>
          )}

          {/* 🎤 Audio Controls */}
          <div className="flex items-center gap-3 mb-6">
            {!recording && !showNextButton ? (
              <button
                onClick={startRecording}
                disabled={analyzing || isNavigationDisabled}
                className="px-4 py-2 bg-[#1b65a6] text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? "Analyzing..." : "Start Recording"}
              </button>
            ) : !showNextButton ? (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              >
                Stop Recording
              </button>
            ) : null}
          </div>

          {feedback && (
            <p
              className={`mt-2 text-base font-semibold ${feedback.includes("✅")
                ? "text-green-600"
                : feedback.includes("❌")
                  ? "text-red-600"
                  : "text-yellow-600"
                }`}
            >
              {feedback}
            </p>
          )}

          {/* Next Button for current question */}
          {showNextButton && currentStep < totalSteps && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
              >
                Next Question →
              </button>
            </div>
          )}
        </div>

        {/* Navigation Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || isNavigationDisabled || !showNextButton}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition"
          >
            ‹
          </button>

          {questions.map((q, i) => {
            const qNum = i + 1;
            const qId = q.question_id;
            const isActive = currentStep === qNum;
            const correctness = analysisResults[qId]?.correctness;
            const showNext = answers[`show-next-${qId}`];

            const color =
              correctness === "correct"
                ? "bg-green-400"
                : showNext && correctness === "wrong"
                  ? "bg-orange-400"
                  : showNext
                    ? "bg-blue-400"
                    : "bg-gray-300";

            return (
              <button
                key={qNum}
                onClick={() => {
                  if (!isNavigationDisabled && answers[`show-next-${qId}`]) {
                    setCurrentStep(qNum);
                    setFeedback("");
                  }
                }}
                disabled={isNavigationDisabled || !answers[`show-next-${qId}`]}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isActive ? "ring-2 ring-yellow-400" : ""
                  } ${color} ${isNavigationDisabled || !answers[`show-next-${qId}`] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {qNum}
              </button>
            );
          })}

          <button
            onClick={handleNext}
            disabled={currentStep === totalSteps || isNavigationDisabled || !showNextButton}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition"
          >
            ›
          </button>
        </div>

        {/* ✅ Submit Button */}
        {currentStep === totalSteps && allQuestionsCompleted && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={isNavigationDisabled}
              className={`px-6 py-3 rounded-lg transition font-medium ${!isNavigationDisabled
                ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              Submit Assignment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;