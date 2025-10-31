import React, { useEffect, useState } from "react";

const Topics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      try {
        // 🧩 Get user from localStorage
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.user_id;

        if (!userId) {
          console.error("User ID not found in localStorage");
          setLoading(false);
          return;
        }

        // 🧩 Fetch topics for the user
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/topics/${userId}/subtopics`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch topics");
        }

        const data = await response.json();

        // Extract only the topic-level info
        const topicList =
          data.data?.map((topic) => ({
            topic_id: topic.topic_id,
            topic_name: topic.topic_name,
            subtopics_count: topic.sub_topics?.length || 0,
            progress: Math.floor(Math.random() * 100), // mock topic progress
          })) || [];

        setTopics(topicList);
      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading topics...
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No topics found.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Available Topics</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <div
            key={topic.topic_id}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6 border-l-4 border-blue-500 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {topic.topic_name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {topic.subtopics_count} Subtopics
              </p>
            </div>

            <div className="mt-auto">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Progress
              </p>
              <div className="w-full bg-gray-200 rounded-full h-[10px] relative overflow-hidden mb-3">
                <div
                  className="bg-blue-500 h-[10px] rounded-full transition-all duration-500"
                  style={{ width: `${topic.progress}%` }}
                ></div>
              </div>

              <a
                href={`/student/${topic.topic_id}/subtopics`}
                className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-500 transition-colors block text-center"
              >
                View Subtopics
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Topics;
