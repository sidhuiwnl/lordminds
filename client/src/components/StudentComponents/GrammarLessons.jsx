import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const GrammarLessons = () => {
  const { topic } = useParams(); // 🔹 Gets topic_id from URL
  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch subtopics dynamically
  useEffect(() => {
    async function fetchSubtopics() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/users/${topic}/subtopics`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subtopics");
        }

        const data = await response.json();
        setSubtopics(data.data || []);
      } catch (error) {
        console.error("Error fetching subtopics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubtopics();
  }, [topic]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading subtopics...
      </div>
    );
  }

  if (subtopics.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No subtopics found.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Subtopics</h2>

      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        {subtopics.map((sub) => (
          <div
            key={sub.sub_topic_id}
            className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-3 lg:mb-4">
              <h3 className="font-bold text-base lg:text-lg text-gray-800">
                {sub.sub_topic_name}
              </h3>
              <a
                href={`/student/${sub.sub_topic_id}/lessonsoverview`}
                rel="noopener noreferrer"
                className="bg-yellow-400 text-gray-900 px-3 lg:px-4 py-2 rounded-sm text-xs lg:text-sm font-medium hover:bg-yellow-500 transition-colors w-full sm:w-auto text-center"
              >
                Start
              </a>
            </div>

            <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
              {sub.has_document
                ? `Document: The Present Tense is used to express actions that are happening now, habits, general truths, or ongoing situations. It has four main forms in English.`
                : "No document available"}
            </p>

            <p className="text-xs text-gray-500">
              Created at: {new Date(sub.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrammarLessons;
