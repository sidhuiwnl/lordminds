import React from "react";

const AssignmentMarks = () => {
  const assignments = [
    { name: "Assignment 1", marks: "★★★★", marksColor: "text-orange-500" },
    { name: "Assignment 2", marks: "★★★★", marksColor: "text-blue-500" },
    { name: "Assignment 3", marks: "★★★★", marksColor: "text-orange-500" },
    { name: "Assignment 4", marks: "★★★", marksColor: "text-blue-500" },
    { name: "Assignment 5", marks: "★★★★", marksColor: "text-green-500" },
  ];

  const pointsData = [
    { points: 100, stars: "★★★★", starColor: "text-green-500" },
    { points: 80, stars: "★★★★", starColor: "text-blue-500" },
    { points: 60, stars: "★★★★", starColor: "text-orange-500" },
    { points: 40, stars: "★★★", starColor: "text-yellow-500" },
    { points: 20, stars: "★", starColor: "text-red-500" },
  ];

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4 lg:mb-6">Assignment Marks</h2>
          <div className="flex flex-col lg:flex-row justify-center items-start gap-4 lg:gap-8">
            {/* Table */}
            <div className="overflow-x-auto w-full lg:w-80">
              <table className="table-auto border border-[#1b65a6] rounded-lg overflow-hidden min-w-[250px]">
                <thead>
                  <tr className="bg-[#1b65a6] text-white">
                    <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tl-lg">Assignments</th>
                    <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tr-lg">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700">{assignment.name}</td>
                      <td className="border border-gray-200 px-2 lg:px-4 py-2">
                        <span className={assignment.marksColor}>{assignment.marks}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Points Legend */}
            <div className="flex flex-col space-y-2 text-right w-full lg:w-32">
              {pointsData.map((point, index) => (
                <div key={index} className="flex flex-col items-end space-y-1">
                  <span className="text-xs lg:text-sm text-gray-700">{point.points} Points</span>
                  <span className={point.starColor}>{point.stars}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentMarks;