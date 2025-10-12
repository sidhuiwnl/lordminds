import React from "react";

const CurrentMarks = () => {
  const marksData = [
    { topic: "Topic 1", marks: 95 },
    { topic: "Topic 2", marks: 80 },
    { topic: "Topic 3", marks: 95 },
    { topic: "Topic 4", marks: 90 },
    { topic: "Topic 5", marks: 75 },
  ];

  const totalMarks = marksData.reduce((sum, item) => sum + item.marks, 0);

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4 lg:mb-6">Current Marks</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse min-w-[300px]">
              <thead>
                <tr className="bg-[#1b65a6] text-white">
                  <th className="border border-[#1b65a6] px-3 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tl-lg">Topics Covered</th>
                  <th className="border border-[#1b65a6] px-3 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tr-lg">Marks</th>
                </tr>
              </thead>
              <tbody>
                {marksData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="border border-gray-200 px-3 lg:px-4 py-2 text-xs lg:text-base text-gray-700">{item.topic}</td>
                    <td className="border border-gray-200 px-3 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">{item.marks}</td>
                  </tr>
                ))}
                <tr className="border-b border-gray-200">
                  <td className="border border-gray-200 px-3 lg:px-4 py-2 font-bold text-xs lg:text-base">Total Marks Obtained</td>
                  <td className="border border-gray-200 px-3 lg:px-4 py-2 font-bold text-xs lg:text-base">{totalMarks} Marks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentMarks;