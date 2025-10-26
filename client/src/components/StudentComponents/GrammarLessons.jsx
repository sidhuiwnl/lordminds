import React, { useEffect, useState } from "react";

const GrammarLessons = () => {
  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubtopics() {
      try {
        // 🧩 Get user details from localStorage
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.user_id;

        if (!userId) {
          console.error("User ID not found in localStorage");
          setLoading(false);
          return;
        }

        // 🧩 Fetch subtopics for the user
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/topics/${userId}/subtopics`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subtopics");
        }

        const data = await response.json();

        // 🧩 Flatten nested topic/subtopic structure
        const allSubtopics =
          data.data?.flatMap((topicItem) =>
            topicItem.sub_topics.map((sub) => ({
              ...sub,
              topic_name: topicItem.topic_name, // optional
              progress: Math.floor(Math.random() * 100), // mock progress
            }))
          ) || [];

        setSubtopics(allSubtopics);
      } catch (error) {
        console.error("Error fetching subtopics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubtopics();
  }, []);

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
              <div>
                <h3 className="font-bold text-base lg:text-lg text-gray-800">
                  {sub.sub_topic_name}
                </h3>
                <p className="text-xs text-gray-500">
                  Topic: {sub.topic_name}
                </p>
              </div>

              <a
                href={`/student/${sub.sub_topic_id}/lessonsoverview`}
                rel="noopener noreferrer"
                className="bg-yellow-400 text-gray-900 px-3 lg:px-4 py-2 rounded-sm text-xs lg:text-sm font-medium hover:bg-yellow-500 transition-colors w-full sm:w-auto text-center"
              >
                Start
              </a>
            </div>

            <p className="text-xs lg:text-sm text-gray-600 font-semibold mb-3 lg:mb-4">
              The Present Tense is used to express actions that are happening
              now, habits, general truths, or ongoing situations. It has four
              main forms in English.
            </p>

            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Progress
              </p>
              <div className="w-full bg-gray-200 rounded-full h-[25px] relative overflow-hidden">
                <div
                  className="bg-blue-500 h-6 rounded-full transition-all duration-500 relative"
                  style={{ width: `${sub.progress}%` }}
                >
                  <span className="absolute left-2 text-xs text-white font-semibold">
                    {sub.progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrammarLessons;
