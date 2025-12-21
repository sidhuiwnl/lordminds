import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecordRTC from "recordrtc";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

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
  const [testCompleted, setTestCompleted] = useState(false);
  const [existingResults, setExistingResults] = useState(null);
  const [attemptCounts, setAttemptCounts] = useState({});
  const [showCorrectAnswer, setShowCorrectAnswer] = useState({});
  const recorderRef = useRef(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [blurHandled, setBlurHandled] = useState(false);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const totalSteps = questions.length;
  const API_URL = import.meta.env.VITE_BACKEND_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.user_id;

  const processQuestionData = (questionType, rawData) => {
    if (!rawData) return {};

    try {
      let convertedData = rawData;

      // 1. MATCH QUESTIONS
      if (questionType === "match") {
        const left = [];
        const right = [];
        const matches = {};

        // Extract left column from option_a, option_b, etc.
        ["option_a", "option_b", "option_c", "option_d", "option_e", "option_f"].forEach(key => {
          if (rawData[key]) {
            left.push(rawData[key]);
          }
        });

        // Extract right column from column2
        if (rawData.column2) {
          right.push(...rawData.column2.split(",").map(item => item.trim()));
        }

        // Convert correct answer format "D,B,C,A" to matches object
        if (rawData.correct_answer) {
          const answers = rawData.correct_answer.split(",").map(item => item.trim());
          answers.forEach((rightLetter, index) => {
            if (index < left.length) {
              const leftLetter = String.fromCharCode(65 + index); // A, B, C, D
              const rightIndex = rightLetter.charCodeAt(0) - 64; // A=1, B=2, C=3, D=4
              matches[leftLetter] = String(rightIndex);
            }
          });
        }

        convertedData = { left, right, matches };
      }

      else if (questionType === "fill_blank") {
        const correctAnswers = rawData.correct_answer
          ? rawData.correct_answer.split(",").map(item => item.trim())
          : [];

        // Use generateFillBlankOptions instead of generateDistractors
        const options = generateFillBlankOptions(correctAnswers);

        convertedData = {
          correct_answers: correctAnswers,
          options: options
        };
      }
      // 3. PRONUNCIATION QUESTIONS
      else if (questionType === "pronunciation") {
        const correctAnswer = rawData.correct_answer || rawData.pronunciation_word;
        convertedData = {
          correct_answer: correctAnswer,
        };
      }

      // 4. MCQ QUESTIONS
      else if (questionType === "mcq") {
        const options = [];
        ["option_a", "option_b", "option_c", "option_d", "option_e"].forEach(key => {
          if (rawData[key]) {
            options.push(rawData[key]);
          }
        });

        convertedData = {
          options,
          correct_answer: rawData.correct_answer
        };
      }

      // 5. TRUE/FALSE QUESTIONS
      else if (questionType === "true_false") {
        const options = [];
        ["option_a", "option_b"].forEach(key => {
          if (rawData[key]) {
            options.push(rawData[key]);
          }
        });

        // Ensure correct_answer is lowercase for consistency
        const correctAnswer = rawData.correct_answer
          ? rawData.correct_answer.toString().toLowerCase()
          : "";

        convertedData = {
          options,
          correct_answer: correctAnswer
        };
      }

      return convertedData;
    } catch (error) {
      console.error(`Error processing ${questionType} question:`, error, rawData);
      return {
        error: true,
        message: "Failed to process question data",
        rawData
      };
    }
  };

  // 🔁 Retry wrapper
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

  // ===============================
  // SECURITY FEATURES
  // ===============================
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
       2. Disable Copy / Cut
    ------------------------------------------------ */
    const preventCopy = (e) => {
      e.preventDefault();
      toast.error("⚠️ Copying is disabled.");
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
      setBlurHandled(false);
    };

    /* -----------------------------------------------
       6. Detect Screen Capture Tools (Snipping Tool)
    ------------------------------------------------ */
    const snipDetection = setInterval(() => {
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
      document.removeEventListener("contextmenu", preventRightClick);

      clearInterval(snipDetection);
    };
  }, [blurHandled, navigate]);

  // ===============================
  // FULLSCREEN ENFORCEMENT
  // ===============================
  useEffect(() => {
    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log("Fullscreen request failed:", err);
        });
      }
    };

    // Wait for component to mount
    const timeoutId = setTimeout(enterFullscreen, 100);

    const onFSChange = () => {
      if (blurHandled) return;

      if (!document.fullscreenElement) {
        toast.error("⚠️ Fullscreen required! Exiting test...");
        navigate("/student/studenthome");
      }
    };

    document.addEventListener("fullscreenchange", onFSChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("fullscreenchange", onFSChange);
    };
  }, [blurHandled, navigate]);

  const speakText = useCallback((text) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error("Speech error:", e);
    }
  }, []);

  // Add this function (similar to Assignments)
  const generateFillBlankOptions = useCallback((correctAnswers) => {
    if (!correctAnswers || correctAnswers.length === 0) return [];

    const commonDistractors = [
      "is", "are", "was", "were", "has", "have", "had",
      "do", "does", "did", "can", "could", "will", "would",
      "shall", "should", "may", "might", "must",
      "the", "a", "an", "this", "that", "these", "those",
      "in", "on", "at", "by", "with", "from", "to", "for",
      "and", "but", "or", "nor", "so", "yet",
      "quickly", "slowly", "carefully", "happily", "sadly",
      "good", "bad", "big", "small", "happy", "sad",
      "run", "walk", "jump", "talk", "speak", "listen",
      "man", "woman", "child", "people", "person"
    ];

    // Get unique distractors that are not correct answers
    const usedWords = new Set(correctAnswers.map(a => a.toLowerCase()));
    const availableDistractors = commonDistractors.filter(
      word => !usedWords.has(word.toLowerCase())
    );

    // Combine correct answers with distractors
    const allOptions = [...correctAnswers];

    // Add 3-5 distractors
    const shuffledDistractors = [...availableDistractors]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(5, availableDistractors.length));

    allOptions.push(...shuffledDistractors);

    // Shuffle all options together
    return [...allOptions].sort(() => Math.random() - 0.5);
  }, []);

  // ✅ Fetch Questions - with MATCH RHS shuffle and FILL_BLANK options shuffle
  useEffect(() => {
    if (testCompleted) {
      setLoading(false);
      return;
    }

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
          const processed = data.data.map((q) => {
            const questionType = q.question_type;
            const rawData = q.question_data || {};
            const processedData = processQuestionData(questionType, rawData);

            return {
              ...q,
              question_data: processedData,
            };
          });

          // Apply question-specific processing
          const fullyProcessed = processed.map((q) => {
            // 1. Shuffle RIGHT side for MATCH questions
            if (q.question_type === "match") {
              const { left = [], right = [], matches = {} } = q.question_data || {};
              if (
                !Array.isArray(left) ||
                !Array.isArray(right) ||
                !left.length ||
                !right.length ||
                !matches ||
                Object.keys(matches).length === 0
              ) {
                return q;
              }

              // Shuffle right column indices
              const indices = right.map((_, idx) => idx);
              indices.sort(() => Math.random() - 0.5);
              const shuffledRight = indices.map((i) => right[i]);

              // Rebuild matches
              const newMatches = {};
              Object.entries(matches).forEach(([letter, num]) => {
                const originalIndex = parseInt(num, 10) - 1;
                if (isNaN(originalIndex) || originalIndex < 0 || originalIndex >= right.length) {
                  return;
                }
                const text = right[originalIndex];
                const newIndex = shuffledRight.indexOf(text);
                if (newIndex !== -1) {
                  newMatches[letter] = String(newIndex + 1);
                }
              });

              return {
                ...q,
                question_data: {
                  ...q.question_data,
                  right: shuffledRight,
                  matches: newMatches,
                },
              };
            }

            // 2. For FILL_BLANK questions, ensure options exist
            if (q.question_type === "fill_blank") {
              const questionData = q.question_data || {};

              // Get correct answers as array
              const correctAnswers = Array.isArray(questionData.correct_answers)
                ? questionData.correct_answers
                : [questionData.correct_answer].filter(Boolean);

              // If options don't exist, create them
              if (!Array.isArray(questionData.options) || questionData.options.length === 0) {
                const options = [
                  ...correctAnswers,
                  ...generateFillBlankOptions(correctAnswers)
                ].sort(() => Math.random() - 0.5);

                return {
                  ...q,
                  question_data: {
                    ...questionData,
                    options: options,
                    correct_answers: correctAnswers,
                  },
                };
              }

              // If options exist, ensure correct_answers is set
              return {
                ...q,
                question_data: {
                  ...questionData,
                  correct_answers: correctAnswers,
                },
              };
            }

            if (q.question_type === "pronunciation") {
              // Remove any options or correct_answers array
              const { options, correct_answers, ...restData } = q.question_data || {};
              return {
                ...q,
                question_data: {
                  ...restData,
                  // Ensure we only have correct_answer (not an array)
                  correct_answer: q.question_data.correct_answer ||
                    (Array.isArray(q.question_data.correct_answers) ?
                      q.question_data.correct_answers[0] : ""),
                },
              };
            }

            // 3. For MCQ and TRUE_FALSE, ensure options array exists
            if (["mcq", "true_false"].includes(q.question_type)) {
              if (!Array.isArray(q.question_data.options)) {
                // Convert option_a, option_b, etc. to array if needed
                const options = [];
                for (let i = 0; i < 10; i++) {
                  const key = `option_${String.fromCharCode(97 + i)}`; // a, b, c, ...
                  if (q.question_data[key]) {
                    options.push(q.question_data[key]);
                  } else {
                    break;
                  }
                }

                if (options.length > 0) {
                  return {
                    ...q,
                    question_data: {
                      ...q.question_data,
                      options: options,
                    },
                  };
                }
              }
            }

            return q;
          });

          setOriginalQuestions(fullyProcessed);

          // Shuffle question order
          const orderKey = `assessment_${subtopic}_order`;
          const saved = localStorage.getItem(orderKey);
          const now = Date.now();
          const twoHours = 2 * 60 * 60 * 1000;

          let shuffledQuestions;
          if (saved) {
            try {
              const { order, timestamp } = JSON.parse(saved);
              if (now - timestamp < twoHours) {
                const ordered = order
                  .map((id) => fullyProcessed.find((q) => q.question_id === id))
                  .filter(Boolean);

                if (ordered.length === fullyProcessed.length) {
                  shuffledQuestions = ordered;
                }
              }
            } catch (e) {
              console.warn("Corrupt order, resetting...");
            }
          }

          if (!shuffledQuestions) {
            shuffledQuestions = [...fullyProcessed].sort(() => Math.random() - 0.5);
            localStorage.setItem(orderKey, JSON.stringify({
              order: shuffledQuestions.map((q) => q.question_id),
              timestamp: now,
            }));
          }

          setQuestions(shuffledQuestions);

          // Initialize states
          const initialAttempts = {};
          const initialShowAnswer = {};
          const initialAnswers = {};
          shuffledQuestions.forEach((q) => {
            initialAttempts[q.question_id] = 0;
            initialShowAnswer[q.question_id] = false;

            if (["mcq", "true_false", "fill_blank"].includes(q.question_type)) {
              initialAnswers[`text-${q.question_id}`] = "";
            }
          });
          setAttemptCounts(initialAttempts);
          setShowCorrectAnswer(initialShowAnswer);
          setAnswers(initialAnswers);

          if (!sessionId && !sessionEnded) await startSession();
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        setError(err.message);
        toast.error("Failed to load questions. Please try again.");
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

    if (subtopic && !testCompleted) {
      fetchQuestions();
      fetchSubTopicDetails();
    }
  }, [subtopic, API_URL, testCompleted, sessionId, sessionEnded, generateFillBlankOptions]);

  const currentQuestion = questions[currentStep - 1];

  // ===============================
  // SESSION MANAGEMENT
  // ===============================
  const startSession = async () => {
    if (!userId || sessionEnded || sessionId) return;
    try {
      const res = await retryFetch(async () => {
        const response = await fetch(`${API_URL}/tests/start/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            user_id: parseInt(userId),
            subtopic_id: parseInt(subtopic) 
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        return response;
      });
      const data = await res.json();
      if (data.status === "success") {
        setSessionId(data.session_id);
        console.log("✅ Test session started:", data.session_id);
      } else {
        console.error("Failed to start session:", data.message);
        toast.error("Failed to start session. Please try again.");
      }
    } catch (err) {
      console.error("Error starting session:", err);
      toast.error("Failed to start session. Please refresh and try again.");
    }
  };

  const endSession = async () => {
    if (!sessionId || sessionEnded) return;
    try {
      await retryFetch(async () => {
        const response = await fetch(`${API_URL}/tests/end/${sessionId}`, { 
          method: "PUT",
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
      });
      console.log("✅ Test session ended:", sessionId);
      setSessionEnded(true);
    } catch (err) {
      console.error("Error ending session:", err);
      toast.error("Failed to end session.");
    }
  };

  // ===============================
  // AUDIO RECORDING
  // ===============================
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

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    
    const recorder = recorderRef.current;
    const stream = recorder.stream;
    
    try {
      await recorder.stopRecording(async () => {
        const blob = recorder.getBlob();
        setRecording(false);
        
        // Clean up stream properly
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
          });
        }
        
        // Clear the reference
        recorderRef.current = null;
        
        // Store audio answer
        if (currentQuestion) {
          setAnswers((prev) => ({
            ...prev,
            [`audio-${currentQuestion.question_id}`]: blob,
          }));
        }
        
        speakText("Analyzing your answer");
        await sendAudioForAnalysis(blob);
      });
    } catch (err) {
      console.error("Error stopping recording:", err);
      setRecording(false);
      recorderRef.current = null;
    }
  };

  // ===============================
  // CLEANUP ON UNMOUNT
  // ===============================
  useEffect(() => {
    return () => {
      // Clean up speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Clean up session
      if (sessionId && !sessionEnded) {
        endSession();
      }
      
      // Clean up recording
      if (recorderRef.current) {
        if (recorderRef.current.stream) {
          recorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        recorderRef.current = null;
      }
    };
  }, [sessionId, sessionEnded]);

  // ===============================
  // AUDIO ANALYSIS (All question types)
  // ===============================
  const sendAudioForAnalysis = async (audioBlob) => {
    if (!currentQuestion) return;

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
      setAttemptCounts((prev) => ({ ...prev, [qid]: newAttemptCount }));

      const rawTranscript =
        result?.data?.transcription ||
        result?.transcription ||
        result?.text ||
        "";
      const transcript = rawTranscript
        .toLowerCase()
        .replace(/[.,!?;:'"()]/g, "")
        .trim();

      if (!transcript || transcript.includes("could not understand")) {
        setFeedback("Could not understand. Speak clearly.");
        speakText("Could not understand. Try again.");
        setAnalyzing(false);
        return;
      }

      let isCorrect = false;
      let correctText = "";
      let userAnswer = transcript;

      // 1. FILL IN THE BLANKS
      if (currentQuestion.question_type === "fill_blank") {
        const correctAnswers = Array.isArray(
          currentQuestion.question_data.correct_answers
        )
          ? currentQuestion.question_data.correct_answers.map((a) =>
            a.toString().toLowerCase().trim()
          )
          : [
            currentQuestion.question_data.correct_answer
              ?.toString()
              .toLowerCase()
              .trim(),
          ].filter(Boolean);

        const allCorrect = correctAnswers.every((ans) =>
          transcript.includes(ans)
        );

        isCorrect = allCorrect;
        correctText = correctAnswers.join(" and ");

        setAnswers((prev) => ({
          ...prev,
          [`text-${qid}`]: transcript
        }));
      }

      // 2. PRONUNCIATION
      else if (currentQuestion.question_type === "pronunciation") {
        const correctAnswer = currentQuestion.question_data.correct_answer;

        if (!correctAnswer) {
          setFeedback("No correct answer found for pronunciation.");
          setAnalyzing(false);
          return;
        }

        const correctAnswerLower = correctAnswer.toString().toLowerCase().trim();
        const transcriptLower = transcript.toLowerCase();

        isCorrect = transcriptLower.includes(correctAnswerLower) ||
          correctAnswerLower.includes(transcriptLower) ||
          transcriptLower.replace(/\s+/g, "") === correctAnswerLower.replace(/\s+/g, "");

        correctText = correctAnswer;
      }

      // 3. TRUE/FALSE
      else if (currentQuestion.question_type === "true_false") {
        const correctAnswer = currentQuestion.question_data.correct_answer;

        // Normalize to a real boolean safely
        const isCorrectBool =
          typeof correctAnswer === "boolean"
            ? correctAnswer
            : correctAnswer?.toString().toLowerCase() === "true";

        let transcriptBool = null;
        const t = transcript.toLowerCase();

        if (t.includes("true") || t.includes("yes") || t.includes("correct")) {
          transcriptBool = true;
        } else if (t.includes("false") || t.includes("no") || t.includes("wrong")) {
          transcriptBool = false;
        }

        // If we couldn't confidently parse, treat as wrong
        if (transcriptBool === null) {
          isCorrect = false;
        } else {
          isCorrect = isCorrectBool === transcriptBool;
        }

        correctText = isCorrectBool ? "TRUE" : "FALSE";

        setAnswers((prev) => ({
          ...prev,
          [`text-${qid}`]: transcriptBool === null
            ? transcript
            : transcriptBool
              ? "True"
              : "False",
        }));
      }

      // 4. MCQ
      else if (currentQuestion.question_type === "mcq") {
        const correctAnswer =
          currentQuestion.question_data.correct_answer
            ?.toString()
            .toLowerCase()
            .trim();
        const options = (currentQuestion.question_data.options || []).map(
          (o) => o.toString().toLowerCase().trim()
        );

        const correctIndex = options.indexOf(correctAnswer);
        const correctLetter =
          correctIndex !== -1
            ? String.fromCharCode(65 + correctIndex).toLowerCase()
            : "";

        const acceptable = [
          correctAnswer,
          correctLetter,
          correctLetter.toUpperCase(),
        ];

        isCorrect = acceptable.some((ans) => transcript.includes(ans));
        const displayAnswer =
          correctIndex !== -1
            ? `${String.fromCharCode(65 + correctIndex)}: ${currentQuestion.question_data.options[correctIndex]
            }`
            : correctAnswer?.toUpperCase();
        correctText = displayAnswer || "";

        setAnswers((prev) => ({ ...prev, [`text-${qid}`]: transcript }));
      }

      // 5. MATCH THE FOLLOWING
      else if (currentQuestion.question_type === "match") {
        const { left = [], right = [], matches = {} } =
          currentQuestion.question_data || {};

        if (
          !Array.isArray(left) ||
          !Array.isArray(right) ||
          !left.length ||
          !right.length ||
          !matches ||
          Object.keys(matches).length === 0
        ) {
          setFeedback("Question data error.");
          setAnalyzing(false);
          return;
        }

        const correctPairs = Object.entries(matches);
        let matchedCount = 0;

        correctPairs.forEach(([letter, correctNum]) => {
          const leftText =
            (left[letter.charCodeAt(0) - 65] || "")
              .toString()
              .toLowerCase();
          const rightText =
            (right[parseInt(correctNum, 10) - 1] || "")
              .toString()
              .toLowerCase();

          const patterns = [
            new RegExp(
              `\\b${letter.toLowerCase()}\\s*(?:to|-)?\\s*${correctNum}\\b`
            ),
            new RegExp(
              `\\b${correctNum}\\s*(?:to|-)?\\s*${letter.toLowerCase()}\\b`
            ),
            new RegExp(`\\b${leftText}\\b.*\\b${rightText}\\b`),
            new RegExp(`\\b${rightText}\\b.*\\b${leftText}\\b`),
          ];

          if (patterns.some((p) => p.test(transcript))) {
            matchedCount++;
          }
        });

        isCorrect = matchedCount === correctPairs.length;
        correctText = correctPairs
          .map(([l, r]) => {
            const lt = left[l.charCodeAt(0) - 65] || "";
            const rt = right[parseInt(r, 10) - 1] || "";
            return `${l}→${r} (${lt} → ${rt})`;
          })
          .join(", ");
      }

      // 🔚 Final result apply
      if (isCorrect) {
        setFeedback("✅ Correct Answer!");
        setAnalysisResults((prev) => ({
          ...prev,
          [qid]: {
            correctness: "correct",
            userAnswer,
            correctAnswer: correctText,
          },
        }));
        setAnswers((prev) => ({ 
          ...prev, 
          [`show-next-${qid}`]: true,
          [`text-${qid}`]: userAnswer 
        }));
        speakText("Correct");
      } else {
        if (newAttemptCount >= 2) {
          setFeedback(`❌ Incorrect. Correct: ${correctText}`);
          setShowCorrectAnswer((prev) => ({ ...prev, [qid]: true }));
          setAnswers((prev) => ({ 
            ...prev, 
            [`show-next-${qid}`]: true,
            [`text-${qid}`]: userAnswer 
          }));
          setAnalysisResults((prev) => ({
            ...prev,
            [qid]: {
              correctness: "incorrect",
              userAnswer,
              correctAnswer: correctText,
            },
          }));
          speakText(`Wrong. The correct answer is ${correctText}`);
        } else {
          setFeedback(
            `❌ Incorrect. Try again. Attempt ${newAttemptCount}/2`
          );
          setAnalysisResults((prev) => ({
            ...prev,
            [qid]: {
              correctness: "incorrect",
              userAnswer,
              correctAnswer: correctText,
            },
          }));
          speakText("Wrong. Try again");
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setFeedback("Analysis failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // ===============================
  // OPTION CLICK HANDLER (Speak only)
  // ===============================
  const handleOptionSpeak = useCallback((optionText) => {
    if (!currentQuestion) return;
    speakText(optionText);
  }, [currentQuestion, speakText]);

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    setFeedback("");
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
      setFeedback("");
    }
  };

  const calculateScore = useCallback(() => {
    let marksObtained = 0;
    questions.forEach((q) => {
      const analysis = analysisResults[q.question_id];
      if (analysis?.correctness === "correct") marksObtained++;
    });
    return { marks_obtained: marksObtained, max_marks: questions.length };
  }, [questions, analysisResults]);

  const handleSubmitTest = async () => {
    const score = calculateScore();

    // 🚀 SweetAlert2 Confirmation Popup
    const result = await Swal.fire({
      title: "Submit Test?",
      text: "You cannot re-attempt this test after submission.",
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
      // End session first
      await endSession();

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
        if (data.data.already_completed) {
          Swal.fire({
            title: "Already Completed",
            text: "You have already taken this test earlier.",
            icon: "info",
            confirmButtonColor: "#1b65a6",
          });
          localStorage.removeItem(`assessment_${subtopic}_order`);
          navigate("/student/studenthome");
        } else {
          await Swal.fire({
            title: "Test Submitted 🎉",
            text: `You scored ${score.marks_obtained}/${score.max_marks}`,
            icon: "success",
            confirmButtonColor: "#1b65a6",
          });
          localStorage.removeItem(`assessment_${subtopic}_order`);
          navigate("/student/studenthome");
        }
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (err) {
      console.error("Error submitting test:", err);

      Swal.fire({
        title: "Submission Failed",
        text: "There was an error submitting your test. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  // Get correct answer text for display
  const getCorrectAnswerText = useCallback(() => {
    if (!currentQuestion) return "";
    const data = currentQuestion.question_data;

    switch (currentQuestion.question_type) {
      case "fill_blank": {
        const fillAnswers = Array.isArray(data.correct_answers)
          ? data.correct_answers
          : [data.correct_answer].filter(Boolean);
        return fillAnswers.join(" and ");
      }
      case "pronunciation": {
        const pronAnswers = Array.isArray(data.correct_answers)
          ? data.correct_answers
          : [data.correct_answer].filter(Boolean);
        return pronAnswers.join(" or ");
      }
      case "mcq": {
        const correctAnswer = data.correct_answer;
        const options = data.options || [];
        const index = options.indexOf(correctAnswer);
        const letter = index !== -1 ? String.fromCharCode(65 + index) : "?";
        return `${letter}: ${correctAnswer}`;
      }
      case "true_false": {
        const ca = data.correct_answer;
        const isTrue =
          typeof ca === "boolean"
            ? ca
            : ca?.toString().toLowerCase() === "true";
        return isTrue ? "TRUE" : "FALSE";
      }
      case "match": {
        const { left = [], right = [], matches = {} } = data;
        return Object.entries(matches)
          .map(([l, num]) => {
            const lt = left[l.charCodeAt(0) - 65] || "";
            const rt = right[parseInt(num, 10) - 1] || "";
            return `${l}→${num} (${lt} → ${rt})`;
          })
          .join(", ");
      }
      default:
        return data.correct_answer?.toString() || "N/A";
    }
  }, [currentQuestion]);

  // If test already completed, show message
  if (testCompleted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Test Already Completed</h2>
          <p className="text-gray-600 mb-4">
            You have already completed this subtopic test.
          </p>
          <button
            onClick={() => navigate(`/student/subtopic/${subtopic}/results`)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading assessment questions...</p>
      </div>
    );
    
  if (error)
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  if (questions.length === 0)
    return <div className="flex justify-center items-center h-screen text-gray-600">No questions found for this subtopic.</div>;

  const isNavigationDisabled = recording || analyzing;
  const currentQuestionId = currentQuestion?.question_id;
  const showNextButton = currentQuestionId
    ? answers[`show-next-${currentQuestionId}`]
    : false;
  const allQuestionsCompleted = questions.every(
    (q) => answers[`show-next-${q.question_id}`]
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 mt-30 min-h-screen">
      <ToastContainer />

      {/* Test Header */}
      <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800">
            {heading || "Assessment"}
          </h2>
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
        {currentQuestion && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-4">
              {currentStep}. {currentQuestion.question_text}
            </p>

            {/* ==================== QUESTION TYPE RENDERING ==================== */}
            <div className="space-y-6 mb-8">
              {/* 1. MCQ & TRUE/FALSE */}
              {["mcq", "true_false"].includes(currentQuestion.question_type) && (
                <div className="space-y-4">
                  {currentQuestion.question_data?.options?.map(
                    (option, index) => {
                      const optionLetter = String.fromCharCode(65 + index);
                      const rawCorrect = currentQuestion.question_data.correct_answer;
                      const isCorrectOption =
                        rawCorrect !== undefined &&
                        option.toString().trim().toLowerCase() === 
                        rawCorrect.toString().trim().toLowerCase();

                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-4 p-5 border-2 rounded-2xl transition-all duration-300 cursor-pointer hover:shadow-md
                            ${showCorrectAnswer[currentQuestionId] && isCorrectOption
                              ? "bg-green-50 border-green-500 shadow-lg"
                              : "bg-white border-gray-300 hover:border-blue-400"
                            }
                            ${isNavigationDisabled || showNextButton
                              ? "opacity-60 cursor-not-allowed"
                              : "cursor-pointer"
                            }
                          `}
                          onClick={() => !isNavigationDisabled && !showNextButton && handleOptionSpeak(option)}
                        >
                          <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-700">
                              {optionLetter}
                            </span>
                          </div>
                          <span className="text-lg font-medium text-gray-800 flex-1">
                            {option.toString()}
                            {showCorrectAnswer[currentQuestionId] &&
                              isCorrectOption && (
                                <span className="ml-2 text-green-600 font-bold">
                                  ✓ Correct Answer
                                </span>
                              )}
                          </span>
                          <button
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOptionSpeak(option);
                            }}
                          >
                            🔊 Speak
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {currentQuestion.question_type === "pronunciation" && (
                <div className="my-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {currentQuestion.question_data.correct_answer}
                  </p>
                </div>
              )}

              {/* 2. FILL IN BLANKS - Display Options for Speaking Only */}
              {currentQuestion.question_type === "fill_blank" && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-4">
                    <p className="text-amber-800 font-semibold">
                      Click on any option below to hear it spoken. Then use the microphone to speak your answer.
                    </p>
                  </div>

                  {currentQuestion.question_data?.options && currentQuestion.question_data.options.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.question_data.options.map((option, index) => {
                        const correctAnswers = Array.isArray(currentQuestion.question_data.correct_answers)
                          ? currentQuestion.question_data.correct_answers
                          : [currentQuestion.question_data.correct_answer].filter(Boolean);
                        const isCorrectOption = correctAnswers.some(correct =>
                          option.toString().trim().toLowerCase() === correct.toString().trim().toLowerCase()
                        );

                        return (
                          <div
                            key={index}
                            className={`p-5 border-2 rounded-2xl transition-all duration-300 cursor-pointer hover:shadow-md flex items-center justify-between
                              ${showCorrectAnswer[currentQuestionId] && isCorrectOption
                                ? "bg-green-50 border-green-500"
                                : "bg-white border-gray-300 hover:border-blue-400"
                              }
                              ${isNavigationDisabled || showNextButton
                                ? "opacity-60 cursor-not-allowed"
                                : "cursor-pointer"
                              }
                            `}
                            onClick={() => !isNavigationDisabled && !showNextButton && handleOptionSpeak(option)}
                          >
                            <span className="text-lg font-medium text-gray-800">
                              {option.toString()}
                            </span>
                            <div className="flex items-center gap-3">
                              {showCorrectAnswer[currentQuestionId] && isCorrectOption && (
                                <span className="text-green-600 font-bold">✓ Correct</span>
                              )}
                              <button
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOptionSpeak(option);
                                }}
                              >
                                🔊 Speak
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5">
                      <p className="text-yellow-800">
                        No options available. Please speak your answer.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. MATCH THE FOLLOWING */}
              {currentQuestion.question_type === "match" && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Left Column */}
                    <div>
                      <h3 className="font-bold text-lg mb-4 text-blue-700">
                        Column A
                      </h3>
                      {currentQuestion.question_data.left?.map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-3 border-2 border-blue-200 cursor-pointer hover:shadow-md transition group"
                            onClick={() => handleOptionSpeak(`${String.fromCharCode(65 + idx)}: ${item}`)}
                          >
                            <span className="font-bold text-xl text-blue-800 w-10">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span className="text-lg font-medium text-gray-800 flex-1">
                              {item}
                            </span>
                            <button
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium opacity-0 group-hover:opacity-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOptionSpeak(`${String.fromCharCode(65 + idx)}: ${item}`);
                              }}
                            >
                              🔊
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {/* Right Column */}
                    <div>
                      <h3 className="font-bold text-lg mb-4 text-green-700">
                        Column B
                      </h3>
                      {currentQuestion.question_data.right?.map(
                        (item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 bg-green-50 rounded-xl mb-3 border-2 border-green-200 cursor-pointer hover:shadow-md transition group"
                            onClick={() => handleOptionSpeak(`${idx + 1}: ${item}`)}
                          >
                            <span className="font-bold text-xl text-green-800 w-10">
                              {idx + 1}.
                            </span>
                            <span className="text-lg font-medium text-gray-800 flex-1">
                              {item}
                            </span>
                            <button
                              className="text-green-600 hover:text-green-800 text-sm font-medium opacity-0 group-hover:opacity-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOptionSpeak(`${idx + 1}: ${item}`);
                              }}
                            >
                              🔊
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {!showNextButton && (
                    <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-6 text-center">
                      <p className="text-purple-800 font-bold text-lg mb-2">
                        Speak your answers clearly!
                      </p>
                      <p className="text-purple-700 text-base">
                        Example:{" "}
                        <strong>"A two, B one, C four, D three"</strong>
                        <br />
                        OR say:{" "}
                        <strong>
                          "Dog barks, Cat meows, Cow moos, Lion roars"
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. PRONUNCIATION HINT */}
              {currentQuestion.question_type === "pronunciation" &&
                !showNextButton && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mt-6">
                    <p className="text-amber-800 font-semibold flex items-center gap-2">
                      Pronounce the word/phrase clearly
                    </p>
                  </div>
                )}
            </div>

            {/* Show correct answer when revealed */}
            {showCorrectAnswer[currentQuestionId] && (
              <div className="bg-green-100 border-2 border-green-300 rounded-xl p-5 mt-6 shadow-md">
                <p className="text-green-800 font-bold text-lg flex items-center gap-2">
                  Correct Answer:
                  <span className="font-normal text-base ml-2">
                    {getCorrectAnswerText()}
                  </span>
                </p>
              </div>
            )}

            {/* 🎤 Audio Controls - ALWAYS visible for ALL question types */}
            <div className="flex items-center gap-3 mb-6 mt-6">
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

              <div className="text-gray-600 text-sm">
                {!showNextButton && "Speak your answer after clicking Start Recording"}
              </div>
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

            {/* Next Button */}
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
        )}

        {/* Navigation Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={handlePrevious}
            disabled={
              currentStep === 1 ||
              isNavigationDisabled ||
              !answers[`show-next-${currentQuestionId}`]
            }
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
                : showNext && correctness === "incorrect"
                  ? "bg-red-400"
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
                  } ${color} ${isNavigationDisabled || !answers[`show-next-${qId}`]
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                  }`}
              >
                {qNum}
              </button>
            );
          })}

          <button
            onClick={handleNext}
            disabled={
              currentStep === totalSteps ||
              isNavigationDisabled ||
              !showNextButton
            }
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition"
          >
            ›
          </button>
        </div>

        {/* ✅ Submit Button */}
        {currentStep === totalSteps && allQuestionsCompleted && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleSubmitTest}
              disabled={isNavigationDisabled}
              className={`px-6 py-3 rounded-lg transition font-medium ${!isNavigationDisabled
                ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              Submit Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessments;