import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Assessments = () => {
  const { subtopic } = useParams(); // 👈 Fetch subtopic ID from route params
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const totalSteps = questions.length;

  // 🔹 Fetch questions dynamically
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/users/subtopic/${subtopic}/questions`);
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

    if (subtopic) fetchQuestions();
  }, [subtopic]);

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
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
        No questions found for this subtopic.
      </div>
    );

  const currentQuestion = questions[currentStep - 1];

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          {/* Title */}
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-3 lg:mb-4">
            Assessment – Subtopic {subtopic}
          </h2>

          {/* Question */}
          <div className="mb-4 lg:mb-6">
            <p className="text-xs lg:text-sm font-medium text-gray-700 mb-3 lg:mb-4">
              {currentStep}. {currentQuestion.question_text}
            </p>

            {/* Options */}
            <div className="border border-blue-200 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
              <div className="space-y-2 lg:space-y-3">
                {currentQuestion.question_data?.options?.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-start lg:items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`answer-${currentQuestion.question_id}`}
                      className="w-4 h-4 text-[#1b65a6] border-gray-300 focus:ring-[#1b65a6] rounded-full mt-0.5 lg:mt-0 flex-shrink-0"
                    />
                    <span className="text-xs lg:text-sm text-gray-600">
                      {typeof option === "boolean" ? option.toString() : option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 🎧 Voice / Audio UI (kept as-is) */}
          <div className="bg-gray-100 rounded-lg p-2 lg:p-3 mb-4 lg:mb-6">
            <div className="flex items-center space-x-2 lg:space-x-3 flex-wrap gap-2">
              <button className="p-1.5 lg:p-2 hover:bg-gray-200 rounded-full flex-shrink-0">
                <svg
                  className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div className="flex-1 bg-gray-300 rounded-full h-1 relative min-w-0 flex-grow">
                <div className="absolute left-0 top-0 w-3/4 h-full bg-[#1b65a6] rounded-full"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full border border-gray-400"></div>
              </div>
              <button className="p-1.5 lg:p-2 hover:bg-gray-200 rounded-full flex-shrink-0">
                <svg
                  className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <span className="text-xs text-gray-500 min-w-[70px] text-right lg:text-left whitespace-nowrap">
                0:00 / 1:30
              </span>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center space-x-2 mb-4 lg:mb-6 overflow-x-auto pb-1 -mb-1">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index + 1)}
                className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                  currentStep === index + 1
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="w-full sm:w-auto px-4 py-2 text-xs lg:text-sm font-medium text-[#1b65a6] border border-[#1b65a6] rounded-full hover:bg-[#1b65a6] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt; Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === totalSteps}
              className="w-full sm:w-auto px-4 lg:px-6 py-2 bg-yellow-400 text-gray-900 text-xs lg:text-sm font-medium rounded-full hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessments;
