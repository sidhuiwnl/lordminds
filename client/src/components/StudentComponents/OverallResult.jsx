import React from "react";

const OverallResult = () => {
  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4 lg:mb-6">Overall Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-[#1b65a6] rounded-lg overflow-hidden min-w-[400px]">
              <thead>
                <tr className="bg-[#1b65a6] text-white">
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tl-lg">Student Name</th>
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base">Current Mark</th>
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base">Assignment Marks</th>
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base">Total Duration</th>
                  <th className="border border-[#1b65a6] px-2 lg:px-4 py-2 text-left text-xs lg:text-base rounded-tr-lg">Last Login</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">Niharika</td>
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">70</td>
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">60</td>
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">5 hours</td>
                  <td className="border border-gray-200 px-2 lg:px-4 py-2 text-xs lg:text-base text-gray-700 font-medium">27/9/25 - 9:45 AM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallResult;