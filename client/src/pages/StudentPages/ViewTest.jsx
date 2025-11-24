import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ViewTest = () => {
  const { sub_topic_id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [subtopic, setSubtopic] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        const studentId = storedUser?.user_id;

        if (!studentId) {
          navigate("/login");
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/student/subtopic/${sub_topic_id}/view/${studentId}`
        );

        const data = await res.json();

        if (data.status !== "success") {
          console.error(data.detail);
          return;
        }

        setSubtopic(data.data.sub_topic);
        setQuestions(data.data.questions);

      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sub_topic_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading test...
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No test data found.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">

      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {subtopic?.sub_topic_name} – Test Review
      </h2>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div
            key={q.question_id}
            className="bg-white shadow p-6 rounded-xl border border-gray-200"
          >
            {/* Question */}
            <h3 className="font-bold text-gray-900 text-lg mb-3">
              {index + 1}. {q.question_text}
            </h3>

            {/* Options */}
            {q.question_data?.options && (
              <div className="ml-4 space-y-1">
                {q.question_data.options.map((opt, idx) => (
                  <p key={idx} className="text-gray-700">
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
              <p className="font-semibold text-green-700">Correct Answer:</p>
              <p className="text-green-900 font-bold">
                {q.question_data?.correct_answer?.toString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-8 bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
      >
        ← Back
      </button>

    </div>
  );
};

export default ViewTest;
