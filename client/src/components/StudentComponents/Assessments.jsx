import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import RecordRTC from "recordrtc";

const Assessments = () => {
  const { subtopic } = useParams();
  const [questions, setQuestions] = useState([]);
  const [heading, setHeading] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [answers, setAnswers] = useState({});
  const recorderRef = useRef(null);

  const totalSteps = questions.length;
  const API_URL = import.meta.env.VITE_BACKEND_API_URL;

  // Fetch questions and subtopic details
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
  }, [subtopic]);

  const currentQuestion = questions[currentStep - 1];

  // Handle MCQ selection
  const handleOptionChange = (option) => {
    setAnswers({ ...answers, [currentQuestion.question_id]: option });
  };

  // 🎤 Start recording
  const startRecording = async () => {
    setAnalysisResult(null);
    setFeedback("");
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
  };

  // ⏹ Stop recording
  const stopRecording = async () => {
    if (!recorderRef.current) return;
    await recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob();
      setAnswers({ ...answers, [`audio-${currentQuestion.question_id}`]: blob });
      setRecording(false);
    });
  };

  // 🚀 Send to backend for analysis
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

      // ✅ Compare with correct answer
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

  // Navigation
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

  // Loading and error states
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

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4">{heading}</h2>

          {/* Question */}
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

          {/* 🔘 Question Navigation */}
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
        </div>
      </div>
    </div>
  );
};

export default Assessments;
