import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecordRTC from "recordrtc";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";


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
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [blurHandled, setBlurHandled] = useState(false);


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
      if (blurHandled) return;

      setBlurHandled(true);
      setTabSwitchCount(prev => {
        const newCount = prev + 1;

        if (newCount === 1) {
          document.body.style.filter = "blur(50px)";
          toast.error(`⚠️ Window switched! Warning ${newCount}/2`);
        }

        if (newCount >= 2) {
          document.body.style.filter = "none";

          Swal.fire({
            title: "Test Terminated ❌",
            text: "You switched tabs multiple times.",
            icon: "error",
            confirmButtonColor: "#d33",
          }).then(() => {
            navigate("/student/studenthome");
          });
        }

        return newCount;
      });
    };


    const onFocus = () => {
      document.body.style.filter = "none";
      setBlurHandled(false); // Allow next blur event to fire one time
    };


    /* -----------------------------------------------
       6. Detect Screen Capture Tools (Snipping Tool)
    ------------------------------------------------ */
    const snipDetection = setInterval(() => {
      // Only check, don't trigger blur/toast spam
      if (document.hidden || !document.hasFocus()) {
        if (!blurHandled) {
          document.body.style.filter = "blur(50px)";
          toast.error("⚠️ Screen capturing detected!");
        }
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
    // document.addEventListener("selectstart", preventSelect);
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
      // document.removeEventListener("selectstart", preventSelect);
      document.removeEventListener("contextmenu", preventRightClick);

      clearInterval(snipDetection);
    };
  }, []);

  useEffect(() => {
    const enterFullscreen = () => document.documentElement.requestFullscreen();
    enterFullscreen();

    const onFSChange = () => {
      // If fullscreen exited BECAUSE of a blur event, ignore it
      if (blurHandled) return;

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
    setFeedback("Analyzing your answer...");

    const formData = new FormData();
    formData.append("file", audioBlob, "response.wav");

    try {
      const res = await retryFetch(() =>
        fetch(`${API_URL}/users/analyze-voice`, { method: "POST", body: formData })
      );
      const result = await res.json();
      const qid = currentQuestion.question_id;
      const newAttemptCount = (attemptCounts[qid] || 0) + 1;
      setAttemptCounts(prev => ({ ...prev, [qid]: newAttemptCount }));

      const transcript = (
        result?.data?.transcription ||
        result?.transcription ||
        result?.text ||
        ""
      ).toLowerCase().replace(/[.,!?;:'"()]/g, '').trim();

      if (!transcript || transcript.includes("could not understand")) {
        setFeedback("Could not understand. Speak clearly.");
        speechSynthesis.speak(new SpeechSynthesisUtterance("Could not understand. Try again."));
        setAnalyzing(false);
        return;
      }

      let isCorrect = false;
      let correctText = "";

      // 1. FILL IN THE BLANKS
      if (currentQuestion.question_type === "fill_blank") {
        const correctAnswers = Array.isArray(currentQuestion.question_data.correct_answers)
          ? currentQuestion.question_data.correct_answers.map(a => a.toString().toLowerCase().trim())
          : [currentQuestion.question_data.correct_answer?.toString().toLowerCase().trim()].filter(Boolean);

        isCorrect = correctAnswers.every(ans => transcript.includes(ans));
        correctText = correctAnswers.join(" and ");
      }

      // 2. PRONUNCIATION
      else if (currentQuestion.question_type === "pronunciation") {
        const correctAnswers = Array.isArray(currentQuestion.question_data.correct_answers)
          ? currentQuestion.question_data.correct_answers.map(a => a.toString().toLowerCase().trim())
          : [currentQuestion.question_data.correct_answer?.toString().toLowerCase().trim()].filter(Boolean);

        isCorrect = correctAnswers.some(ans => transcript.includes(ans));
        correctText = correctAnswers.join(" or ");
      }

      // 3. MCQ & TRUE/FALSE — FIXED & PERFECT
      else if (["mcq", "true_false"].includes(currentQuestion.question_type)) {
        const correctAnswer = currentQuestion.question_data.correct_answer?.toString().toLowerCase().trim();
        const options = (currentQuestion.question_data.options || []).map(o => o.toString().toLowerCase().trim());

        // Find which option is correct → get its letter
        const correctIndex = options.indexOf(correctAnswer);
        const correctLetter = correctIndex !== -1 ? String.fromCharCode(65 + correctIndex).toLowerCase() : "";

        // What student can say to be correct
        const acceptable = [
          correctAnswer,                    // "went"
          correctLetter,                    // "b"
          correctLetter.toUpperCase(),      // "B"
        ];

        // Extra for True/False
        if (currentQuestion.question_type === "true_false") {
          if (correctAnswer === "true") acceptable.push("yes");
          if (correctAnswer === "false") acceptable.push("no");
        }

        isCorrect = acceptable.some(ans => transcript.includes(ans));
        correctText = correctAnswer.toUpperCase();
      }

      // Final Result
      if (isCorrect) {
        setFeedback("Correct Answer!");
        setAnalysisResults(prev => ({ ...prev, [qid]: { correctness: "correct" } }));
        setAnswers(prev => ({ ...prev, [`show-next-${qid}`]: true }));
        speechSynthesis.speak(new SpeechSynthesisUtterance("Correct"));
      } else {
        if (newAttemptCount >= 2) {
          setFeedback(`Incorrect. Correct: ${correctText}`);
          setShowCorrectAnswer(prev => ({ ...prev, [qid]: true }));
          setAnswers(prev => ({ ...prev, [`show-next-${qid}`]: true }));
          speechSynthesis.speak(new SpeechSynthesisUtterance(`Wrong. The answer is ${correctText}`));
        } else {
          setFeedback(`Incorrect. Try again. Attempt ${newAttemptCount}/2`);
          speechSynthesis.speak(new SpeechSynthesisUtterance("Wrong. Try again"));
        }
      }

    } catch (err) {
      console.error(err);
      setFeedback("Analysis failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
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

    // 🚀 SweetAlert2 Confirmation Popup
    const result = await Swal.fire({
      title: "Submit Assignment?",
      text: "You cannot re-attempt this assignment after submission.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

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

        Swal.fire({
          title: "Assignment Submitted 🎉",
          text: `You scored ${score.marks_obtained}/${score.max_marks}!`,
          icon: "success",
          confirmButtonColor: "#1b65a6",
        });

        localStorage.removeItem(`assignment_${assignment}_order_v3`);
        navigate("/student/studenthome");
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);

      Swal.fire({
        title: "Submission Failed",
        text: "There was an error submitting your assignment. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
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

          {/* Show correct answer when revealed (Supports ALL question types) */}
          {showCorrectAnswer[currentQuestionId] && (
            <div className="bg-green-100 border-2 border-green-300 rounded-xl p-5 mt-6 shadow-md">
              <p className="text-green-800 font-bold text-lg flex items-center gap-2">
                Correct Answer:
                <span className="font-normal text-base">
                  {(() => {
                    const data = currentQuestion.question_data;

                    // Fill in the blanks → multiple answers
                    if (currentQuestion.question_type === "fill_blank") {
                      const answers = Array.isArray(data.correct_answers)
                        ? data.correct_answers
                        : [data.correct_answer].filter(Boolean);
                      return answers.join(" and ");
                    }

                    // Pronunciation → multiple possible pronunciations
                    if (currentQuestion.question_type === "pronunciation") {
                      const answers = Array.isArray(data.correct_answers)
                        ? data.correct_answers
                        : [data.correct_answer].filter(Boolean);
                      return answers.join(" or ");
                    }

                    // MCQ → show letter + text (e.g., "B: went")
                    if (currentQuestion.question_type === "mcq") {
                      const correctAnswer = data.correct_answer;
                      const options = data.options || [];
                      const index = options.indexOf(correctAnswer);
                      const letter = index !== -1 ? String.fromCharCode(65 + index) : "?";
                      return `${letter}: ${correctAnswer}`;
                    }

                    // True/False → just show True or False
                    return data.correct_answer?.toString().toUpperCase() || "N/A";
                  })()}
                </span>
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