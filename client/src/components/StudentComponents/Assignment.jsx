import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import RecordRTC from "recordrtc";

const Assignments = () => {
  const { assignment } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  console.log(questions)

  const recorderRef = useRef(null);

  // Store answers per question
  const [answers, setAnswers] = useState({});
  const totalSteps = questions.length;

  // Fetch assignment questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/assignments/get/${assignment}/questions`
        );
        const data = await res.json();

        console.log(data)

        // Assuming backend returns an array directly
        if (Array.isArray(data)) {
          const parsed = data.map((q) => ({
            ...q,
            question_data: q.question_data || "{}",
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

    fetchQuestions();
  }, [assignment]);

  const currentQuestion = questions[currentStep - 1];

  // MCQ option selection handler
  const handleOptionChange = (option) => {
    setAnswers({ ...answers, [currentQuestion.question_id]: option });
  };

  // Audio recording
  const startRecording = async () => {
    setAnalysisResult(null);
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

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    await recorderRef.current.stopRecording(() => {
      const blob = recorderRef.current.getBlob();
      setAnswers({ ...answers, [`audio-${currentQuestion.question_id}`]: blob });
      setRecording(false);
    });
  };

  const sendAudioForAnalysis = async () => {
    const audioBlob = answers[`audio-${currentQuestion.question_id}`];
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("file", audioBlob, "response.wav");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/users/analyze-voice`,
        {
          method: "POST",
          body: formData,
        }
      );
      const result = await res.json();
      setAnalysisResult(result);
    } catch (err) {
      console.error("Error sending audio:", err);
      setAnalysisResult({ error: "Failed to analyze audio" });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    setAnalysisResult(null);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    setAnalysisResult(null);
  };

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
        No questions found for this assignment.
      </div>
    );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 mt-30 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          <p className="text-xs lg:text-sm font-medium text-gray-700 mb-3 lg:mb-4">
            {currentStep}. {currentQuestion.question_text}
          </p>

          {/* Options */}
          <div className="space-y-3 mb-4 lg:mb-6">
            {currentQuestion.question_data?.options?.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
              const isSelected = answers[currentQuestion.question_id] === option;

              return (
                <label
                  key={index}
                  className="flex items-center space-x-3 cursor-pointer p-3 lg:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 flex-shrink-0">
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-[#1b65a6]"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name={`answer-${currentQuestion.question_id}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleOptionChange(option)}
                    className="sr-only"
                  />
                  <span className="text-sm lg:text-base text-gray-700">
                    <span className="font-medium">{optionLetter} :</span> {option}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Audio Controls */}
          <div className="flex items-center space-x-2 lg:space-x-3 mb-4 lg:mb-6">
            {!recording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-[#1b65a6] text-white rounded-full hover:bg-blue-700"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                Stop Recording
              </button>
            )}

            {answers[`audio-${currentQuestion.question_id}`] && (
              <button
                onClick={sendAudioForAnalysis}
                className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600"
              >
                Analyze Answer
              </button>
            )}
          </div>

          {/* Display Analysis */}
          {analysisResult && (
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <p>
                <strong>Transcription:</strong> {analysisResult.transcription}
              </p>
              <p>
                <strong>Clarity:</strong> {analysisResult.clarity}
              </p>
              <p>
                <strong>Sentiment:</strong> {analysisResult.sentiment}
              </p>
              {analysisResult.correctness && (
                <p>
                  <strong>Correctness:</strong> {analysisResult.correctness}
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 sm:gap-0">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="w-full sm:w-auto px-4 py-2 text-xs lg:text-sm font-medium text-[#1b65a6] border border-[#1b65a6] rounded-full hover:bg-[#1b65a6] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;&lt; Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === totalSteps}
              className="w-full sm:w-auto px-4 lg:px-6 py-2 bg-yellow-400 text-gray-900 text-xs lg:text-sm font-medium rounded-full hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
