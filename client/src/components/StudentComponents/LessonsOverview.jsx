import React from "react";

const LessonsOverview = () => {
  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          {/* Video Player */}
          <div className="relative mb-3 lg:mb-4">
            <video
              className="w-full h-48 lg:h-64 rounded-lg object-cover"
              controls
              poster="" // Optional: Add a poster image if needed
            >
              <source src="/assets/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Attend Quiz Button - Aligned to right and small */}
          <div className="flex justify-end">
            <button className="bg-yellow-400 text-gray-900 px-3 lg:px-4 py-2 rounded-sm text-xs font-medium hover:bg-yellow-500 transition-colors">
              Attend Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonsOverview;