import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const SubtopicsComponent = () => {
  const [subtopics, setSubtopics] = useState([]);
  const [topicName, setTopicName] = useState("");
  const [loading, setLoading] = useState(true);
  const { topic } = useParams();

  useEffect(() => {
    async function fetchSubtopics() {
      try {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.user_id;

        if (!userId) {
          console.error("User ID not found in localStorage");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/topics/${userId}/subtopics/${topic}`,
        );

        if (!response.ok) throw new Error("Failed to fetch subtopics");

        const data = await response.json();

        // ✅ NEW: Handle the single topic response structure
        if (data.data && data.data.sub_topics) {
          const processedSubtopics = data.data.sub_topics.map((sub) => ({
            ...sub,
            topic_name: data.data.topic_name, // Use the topic name from the response
            progress: sub.progress?.completion_percent ?? 0,
          }));

          setSubtopics(processedSubtopics);
          setTopicName(data.data.topic_name);
        } else {
          setSubtopics([]);
        }
      } catch (error) {
        console.error("Error fetching subtopics:", error);
        setSubtopics([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSubtopics();
  }, [topic]); // ✅ Added topic as dependency

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
    <div className="p-4 lg:p-6 mt-20 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {topicName} - Subtopics
      </h2>

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
                <p className="text-sm text-gray-500 mt-2 font-bold">
                  Order: {sub.sub_topic_order}
                </p>
              </div>

              {sub.progress?.is_completed ? (
                <a
                  href={`/student/${sub.sub_topic_id}/view-test`}
                  className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-sm text-xs lg:text-sm font-medium hover:bg-green-700 transition-colors w-full sm:w-auto text-center"
                >
                  View Test
                </a>
              ) : (
                <a
                  href={`/student/${sub.sub_topic_id}/lessonsoverview`}
                  className="bg-yellow-400 text-gray-900 px-3 lg:px-4 py-2 rounded-sm text-xs lg:text-sm font-medium hover:bg-yellow-500 transition-colors w-full sm:w-auto text-center"
                >
                  Start Test
                </a>
              )}
            </div>


            {/* Progress bar */}
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Progress
              </p>
              <div className="w-full bg-gray-200 rounded-full h-[25px] relative overflow-hidden">
                <div
                  className="bg-blue-500 h-6 rounded-full transition-all duration-500 relative"
                  style={{ width: `${sub.progress}%` }}
                >
                  <span className="absolute left-2 text-xs text-white font-semibold mt-1">
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

export default SubtopicsComponent;