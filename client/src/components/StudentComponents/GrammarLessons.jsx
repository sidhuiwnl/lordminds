import React from "react";

const GrammarLessons = () => {
  const lessons = [
    {
      id: 1,
      title: "Present Tense",
      description: "The Present Tense is used to express actions that are happening now, habits, general truths, or ongoing situations. It has four main forms in English.",
      progress: 20,
    },
    {
      id: 2,
      title: "Present Continuous",
      description: "The Present Continuous is used for actions happening right now or temporary situations. It has four main forms in English.",
      progress: 55,
    },
    {
      id: 3,
      title: "Present Perfect",
      description: "The Present Perfect is used for actions that began in the past and continue to the present or have an effect on the present. It has four main forms in English.",
      progress: 48,
    },
    {
      id: 4,
      title: "Present Perfect Continuous",
      description: "The Present Perfect Continuous is used for actions that began in the past and are still continuing, emphasizing the duration. It has four main forms in English.",
      progress: 20,
    },
    {
      id: 5,
      title: "Past Simple",
      description: "The Past Simple is used for actions that are completed in the past. It has four main forms in English.",
      progress: 75,
    },
    {
      id: 6,
      title: "Past Continuous",
      description: "The Past Continuous is used for actions that were ongoing at a specific time in the past. It has four main forms in English.",
      progress: 35,
    },
  ];

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-3 lg:mb-4">
              <h3 className="font-bold text-base lg:text-lg text-gray-800">{lesson.title}</h3>
              <button className="bg-yellow-400 text-gray-900 px-3 lg:px-4 py-2 rounded-sm text-xs lg:text-sm font-medium hover:bg-yellow-500 transition-colors w-full sm:w-auto">
                Start
              </button>
            </div>
            <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">{lesson.description}</p>
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">Progress</p>
            <div className="relative mb-3 lg:mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 lg:h-4 pr-10 lg:pr-12">
                <div
                  className="h-3 lg:h-4 rounded-full bg-[#1b65a6] relative transition-all duration-300"
                  style={{ width: `${lesson.progress}%` }}
                >
                  {lesson.progress > 0 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] lg:text-xs font-bold text-white whitespace-nowrap">
                      {lesson.progress}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs lg:text-sm text-gray-600">
              Progress: {lesson.progress}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrammarLessons;