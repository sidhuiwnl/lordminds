import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const LessonsOverviewPage = () => {
  const { subtopic } = useParams(); // 🔹 Get sub_topic_id from URL
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/users/subtopic/${subtopic}`
        );
        if (!response.ok) throw new Error("Failed to fetch subtopic overview");

        const data = await response.json();
        setOverview(data.data);
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, [subtopic]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading overview...
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Overview not available.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-6">
        {overview.sub_topic_name}
      </h2>

      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          
          
          {overview.overview_video_url ? (
            <div className="relative mb-3 lg:mb-4">
              <video
                className="w-full h-48 lg:h-64 rounded-lg object-cover"
                controls
              >
                <source src={overview.overview_video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : null}

        
          {overview.overview_content ? (
            <div
              className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4"
              dangerouslySetInnerHTML={{
                __html: overview.overview_content,
              }}
            />
          ) : null}

        
          
          <div className="flex justify-end">
            <Link
              to={`/student/${overview.sub_topic_id}/assessments`}
              className="bg-yellow-400 text-gray-900 px-3 lg:px-4 py-2 rounded-sm text-xs lg:text-sm font-medium hover:bg-yellow-500 transition-colors"
            >
              Attend Quiz
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonsOverviewPage;
