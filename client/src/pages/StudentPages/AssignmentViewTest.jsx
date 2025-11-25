import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const AssignmentViewTest = () => {
  const { assignment_id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const studentId = storedUser?.user_id;

        if (!studentId) {
          navigate("/login");
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/student/assignment/${assignment_id}/answers/${studentId}`
        );

        const data = await res.json();
        console.log("Assignment view:", data);

        if (data.status !== "success") return;

        setQuestions(data.data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignment_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading assignment...
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No assignment data found.
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-6 lg:px-10 bg-gray-50 min-h-screen">

      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">
        Assignment – Test Review
      </h2>

      <div className="space-y-6 max-w-3xl mx-auto">
        {questions.map((q, index) => (
          <div
            key={q.question_id}
            className="bg-white shadow-sm p-4 sm:p-5 rounded-xl border border-gray-200"
          >
            {/* Question */}
            <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3 break-words whitespace-normal">
              {index + 1}. {q.question}
            </h3>

            {/* MCQ Options */}
            {q.options && (
              <div className="ml-2 sm:ml-4 space-y-1">
                {q.options.map((opt, idx) => (
                  <p key={idx} className="text-gray-700 break-words whitespace-normal">
                    <span className="font-semibold">
                      {String.fromCharCode(65 + idx)}.
                    </span>{" "}
                    {opt.toString()}
                  </p>
                ))}
              </div>
            )}

            {/* Correct Answer */}
            <div className="mt-4 bg-green-50 border border-green-300 p-3 rounded-md">
              <p className="font-semibold text-green-700 text-sm sm:text-base">
                Correct Answer:
              </p>
              <p className="text-green-900 font-bold break-words whitespace-normal">
                {q.correct_answer?.toString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-8 bg-gray-700 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition w-full sm:w-auto"
      >
        ← Back
      </button>

    </div>
  );
};

export default AssignmentViewTest;
