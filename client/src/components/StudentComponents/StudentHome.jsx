// import React, { useEffect, useState } from "react";
// import data from "./MockData/data.json"; // Adjust path as needed

// const StudentHome = () => {
//   const [appData, setAppData] = useState(data);

//   useEffect(() => {
//     // Fetch data from JSON (already imported, but simulating async if needed)
//     setAppData(data);
//   }, []);

//   // Mock data for UI (extend data.json in future if needed)
//   const assignments = [
//     {
//       id: 1,
//       title: "Assignment 1",
//       status: "Unlocked",
//       icon: "🔓",
//       subtitle: "Grammar Lessons",
//       details: "(Tense, Errors, etc.)",
//       buttonText: "Attend Now",
//       buttonVariant: "yellow",
//       disabled: false,
//     },
//     {
//       id: 2,
//       title: "Assignment 2",
//       status: "Locked",
//       icon: "🔒",
//       subtitle: "Grammar Lessons",
//       details: "(Tense, Errors, etc.)",
//       buttonText: "Attend Now",
//       buttonVariant: "gray",
//       disabled: true,
//     },
//     {
//       id: 3,
//       title: "Assignment 3",
//       status: "Locked",
//       icon: "🔒",
//       subtitle: "Grammar Lessons",
//       details: "(Tense, Errors, etc.)",
//       buttonText: "Attend Now",
//       buttonVariant: "gray",
//       disabled: true,
//     },
//   ];

//   const topics = [
//     {
//       id: 1,
//       title: "Topic 1",
//       status: "Completed",
//       icon: "🏆",
//       progress: 100,
//       score: 92,
//       color: "green",
//     },
//     {
//       id: 2,
//       title: "Topic 2",
//       status: "Learning Now",
//       icon: "▶️",
//       progress: 20,
//       score: 38,
//       color: "orange",
//     },
//     {
//       id: 3,
//       title: "Topic 3",
//       status: "Ongoing",
//       icon: "⏳",
//       progress: 45,
//       score: 45,
//       color: "blue",
//     },
//     {
//       id: 4,
//       title: "Topic 4",
//       status: "Exploring",
//       icon: "🔍",
//       progress: 85,
//       score: 92,
//       color: "yellow",
//     },
//     {
//       id: 5,
//       title: "Topic 5",
//       status: "Not Started",
//       icon: "🔒",
//       progress: 0,
//       score: 0,
//       color: "gray",
//     },
//     {
//       id: 6,
//       title: "Topic 6",
//       status: "Not Started",
//       icon: "🔒",
//       progress: 0,
//       score: 0,
//       color: "gray",
//     },
//     {
//       id: 7,
//       title: "Topic 7",
//       status: "Not Started",
//       icon: "🔒",
//       progress: 0,
//       score: 0,
//       color: "gray",
//     },
//     {
//       id: 8,
//       title: "Topic 8",
//       status: "Not Started",
//       icon: "🔒",
//       progress: 0,
//       score: 0,
//       color: "gray",
//     },
//   ];

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Assignments Section */}
//       <div className="grid grid-cols-3 gap-6 mb-8">
//         {assignments.map((assignment) => (
//           <div
//             key={assignment.id}
//             className={`bg-white rounded-2xl shadow-sm p-6 ${
//               assignment.disabled ? "opacity-60" : ""
//             }`}
//           >
//             <div className="flex justify-between items-start mb-3">
//               <h3 className="font-bold text-lg text-gray-800">{assignment.title}</h3>
//               <span
//                 className={`text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
//                   assignment.disabled
//                     ? "bg-gray-100 text-gray-500"
//                     : "bg-green-100 text-green-800"
//                 }`}
//               >
//                 {assignment.icon} {assignment.status}
//               </span>
//             </div>
//             <p className="text-sm text-gray-600 mb-1">{assignment.subtitle}</p>
//             <p className="text-xs text-gray-500 mb-6">{assignment.details}</p>
//             <button
//               disabled={assignment.disabled}
//               className={`w-full py-2.5 rounded-full text-sm font-medium transition-colors ${
//                 assignment.buttonVariant === "yellow"
//                   ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
//                   : "bg-gray-200 text-gray-500 cursor-not-allowed"
//               }`}
//             >
//               {assignment.buttonText}
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Topics Section */}
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-xl font-bold text-gray-800">Topics</h2>
//         <span className="text-gray-400">...</span>
//       </div>
//       <div className="grid grid-cols-4 gap-6">
//         {topics.map((topic) => {
//           const colorClasses = {
//             green: "bg-green-500 border-green-400",
//             orange: "bg-orange-500 border-orange-400",
//             blue: "bg-blue-500 border-blue-400",
//             yellow: "bg-yellow-500 border-yellow-400 text-gray-900",
//             gray: "bg-gray-300 border-gray-200 text-gray-700",
//           };
//           const statusClasses = {
//             green: "bg-green-100 text-green-800",
//             orange: "bg-orange-100 text-orange-800",
//             blue: "bg-blue-100 text-blue-800",
//             yellow: "bg-yellow-100 text-yellow-800",
//             gray: "bg-gray-100 text-gray-500",
//           };
//           const progressColor = colorClasses[topic.color] || colorClasses.gray;
//           const statusColor = statusClasses[topic.color] || statusClasses.gray;
//           const textColor = topic.color === "yellow" ? "text-gray-900" : "text-white";

//           return (
//             <div
//               key={topic.id}
//               className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
//             >
//               <div className="flex justify-between items-start mb-4">
//                 <h3 className="font-bold text-base text-gray-800">{topic.title}</h3>
//                 <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${statusColor}`}>
//                   {topic.icon} {topic.status}
//                 </span>
//               </div>
//               <div className="relative mb-4">
//                 <div className="w-full bg-gray-200 rounded-full h-4 pr-8">
//                   <div
//                     className={`h-4 rounded-full relative transition-all duration-300 ${progressColor}`}
//                     style={{ width: `${topic.progress}%` }}
//                   >
//                     {topic.progress > 0 && (
//                       <span className={`absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-xs font-bold ${textColor} whitespace-nowrap`}>
//                         {topic.progress}%
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-600 text-left">
//                 Progress: {topic.progress}% Score: {topic.score}/100
//               </p>
//             </div>
//           );
//         })}
//       </div>

//       {/* Optional: Features Section using data.json */}
//       {appData.features && (
//         <div className="mt-12">
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Features</h2>
//           <div className="grid grid-cols-2 gap-6">
//             {appData.features.map((feature, index) => (
//               <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
//                 <h3 className="font-bold text-lg text-gray-800 mb-2">{feature.title}</h3>
//                 <p className="text-sm text-gray-600">{feature.desc}</p>
//               </div>
//             ))}
//           </div>
//           <div className="mt-8 text-center text-gray-600 text-lg">
//             Active Learners: {appData.activeLearners} | Supported Languages: {appData.supportedLanguages}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StudentHome;












import React, { useEffect, useState } from "react";
import data from "./MockData/data.json"; // Adjust path as needed

const StudentHome = () => {
  const [appData, setAppData] = useState(data);

  useEffect(() => {
    // Fetch data from JSON (already imported, but simulating async if needed)
    setAppData(data);
  }, []);

  // Mock data for UI (extend data.json in future if needed)
  const assignments = [
    {
      id: 1,
      title: "Assignment 1",
      status: "Unlocked",
      icon: "🔓",
      subtitle: "Grammar Lessons",
      details: "(Tense, Errors, etc.)",
      buttonText: "Attend Now",
      buttonVariant: "yellow",
      disabled: false,
    },
    {
      id: 2,
      title: "Assignment 2",
      status: "Locked",
      icon: "🔒",
      subtitle: "Grammar Lessons",
      details: "(Tense, Errors, etc.)",
      buttonText: "Attend Now",
      buttonVariant: "gray",
      disabled: true,
    },
    {
      id: 3,
      title: "Assignment 3",
      status: "Locked",
      icon: "🔒",
      subtitle: "Grammar Lessons",
      details: "(Tense, Errors, etc.)",
      buttonText: "Attend Now",
      buttonVariant: "gray",
      disabled: true,
    },
  ];

  const topics = [
    {
      id: 1,
      title: "Topic 1",
      status: "Completed",
      icon: "🏆",
      progress: 100,
      score: 92,
      color: "green",
    },
    {
      id: 2,
      title: "Topic 2",
      status: "Learning Now",
      icon: "▶️",
      progress: 20,
      score: 38,
      color: "orange",
    },
    {
      id: 3,
      title: "Topic 3",
      status: "Ongoing",
      icon: "⏳",
      progress: 45,
      score: 45,
      color: "blue",
    },
    {
      id: 4,
      title: "Topic 4",
      status: "Exploring",
      icon: "🔍",
      progress: 85,
      score: 92,
      color: "yellow",
    },
    {
      id: 5,
      title: "Topic 5",
      status: "Not Started",
      icon: "🔒",
      progress: 0,
      score: 0,
      color: "gray",
    },
    {
      id: 6,
      title: "Topic 6",
      status: "Not Started",
      icon: "🔒",
      progress: 0,
      score: 0,
      color: "gray",
    },
    {
      id: 7,
      title: "Topic 7",
      status: "Not Started",
      icon: "🔒",
      progress: 0,
      score: 0,
      color: "gray",
    },
    {
      id: 8,
      title: "Topic 8",
      status: "Not Started",
      icon: "🔒",
      progress: 0,
      score: 0,
      color: "gray",
    },
  ];

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Assignments Section - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`bg-white rounded-2xl shadow-sm p-4 lg:p-6 ${
              assignment.disabled ? "opacity-60" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-base lg:text-lg text-gray-800">{assignment.title}</h3>
              <span
                className={`text-xs lg:text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
                  assignment.disabled
                    ? "bg-gray-100 text-gray-500"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {assignment.icon} {assignment.status}
              </span>
            </div>
            <p className="text-xs lg:text-sm text-gray-600 mb-1">{assignment.subtitle}</p>
            <p className="text-xs text-gray-500 mb-4 lg:mb-6">{assignment.details}</p>
            <button
              disabled={assignment.disabled}
              className={`w-full py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-medium transition-colors ${
                assignment.buttonVariant === "yellow"
                  ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {assignment.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Topics Section - Responsive grid */}
      <div className="flex justify-between items-center mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-800">Topics</h2>
        <span className="text-gray-400 text-xs lg:text-base">...</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {topics.map((topic) => {
          const colorClasses = {
            green: "bg-green-500 border-green-400",
            orange: "bg-orange-500 border-orange-400",
            blue: "bg-blue-500 border-blue-400",
            yellow: "bg-yellow-500 border-yellow-400 text-gray-900",
            gray: "bg-gray-300 border-gray-200 text-gray-700",
          };
          const statusClasses = {
            green: "bg-green-100 text-green-800",
            orange: "bg-orange-100 text-orange-800",
            blue: "bg-blue-100 text-blue-800",
            yellow: "bg-yellow-100 text-yellow-800",
            gray: "bg-gray-100 text-gray-500",
          };
          const progressColor = colorClasses[topic.color] || colorClasses.gray;
          const statusColor = statusClasses[topic.color] || statusClasses.gray;
          const textColor = topic.color === "yellow" ? "text-gray-900" : "text-white";

          return (
            <div
              key={topic.id}
              className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3 lg:mb-4">
                <h3 className="font-bold text-sm lg:text-base text-gray-800">{topic.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${statusColor}`}>
                  {topic.icon} {topic.status}
                </span>
              </div>
              <div className="relative mb-3 lg:mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3 lg:h-4 pr-6 lg:pr-8">
                  <div
                    className={`h-3 lg:h-4 rounded-full relative transition-all duration-300 ${progressColor}`}
                    style={{ width: `${topic.progress}%` }}
                  >
                    {topic.progress > 0 && (
                      <span className={`absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 text-xs font-bold ${textColor} whitespace-nowrap`}>
                        {topic.progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs lg:text-sm text-gray-600 text-left">
                Progress: {topic.progress}% Score: {topic.score}/100
              </p>
            </div>
          );
        })}
      </div>

      {/* Optional: Features Section using data.json - Responsive grid */}
      {appData.features && (
        <div className="mt-8 lg:mt-12">
          <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4">Features</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {appData.features.map((feature, index) => (
              <div key={index} className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-base lg:text-lg text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 lg:mt-8 text-center text-gray-600 text-base lg:text-lg">
            Active Learners: {appData.activeLearners} | Supported Languages: {appData.supportedLanguages}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;