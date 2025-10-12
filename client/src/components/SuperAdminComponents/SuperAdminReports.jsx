import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SuperAdminReports = () => {
  const [selectedTab, setSelectedTab] = useState("current");

  const tabs = [
    { id: "current", label: "Current Marks" },
    { id: "assignment", label: "Assignment Marks" },
    { id: "duration", label: "Total Duration" },
    { id: "overall", label: "Overall Reports" }
  ];

  const currentMarksData = [
    { name: "1. Hari", topic1: 95, topic2: 60, topic3: 70, average: 75 },
    { name: "2. Bala Kumar", topic1: 80, topic2: 82, topic3: 54, average: 72 },
    { name: "3. Naveen", topic1: 95, topic2: 92, topic3: 84, average: 90.3 },
    { name: "4. Dinesh", topic1: 90, topic2: 80, topic3: 90, average: 86.6 },
    { name: "5. Mukesh", topic1: 76, topic2: 52, topic3: 50, average: 59.3 }
  ];

  const sortedCurrentMarksData = [...currentMarksData].sort((a, b) => b.average - a.average);

  const assignmentNames = ["Basic Essay Writing", "Grammar Quiz", "Spot the Error Challenge"];

  const assignmentMarksData = [
    { 
      name: "1. Hari", 
      assignment1: "Basic Essay Writing", 
      mark1: 85, 
      assignment2: "Grammar Quiz", 
      mark2: 92, 
      assignment3: "Spot the Error Challenge", 
      mark3: 78 
    },
    { 
      name: "2. Bala Kumar", 
      assignment1: "Basic Essay Writing", 
      mark1: 76, 
      assignment2: "Grammar Quiz", 
      mark3: 88, 
      assignment3: "Spot the Error Challenge", 
      mark3: 94 
    },
    { 
      name: "3. Naveen", 
      assignment1: "Basic Essay Writing", 
      mark1: 91, 
      assignment2: "Grammar Quiz", 
      mark2: 85, 
      assignment3: "Spot the Error Challenge", 
      mark3: 79 
    },
    { 
      name: "4. Dinesh", 
      assignment1: "Basic Essay Writing", 
      mark1: 88, 
      assignment2: "Grammar Quiz", 
      mark2: 94, 
      assignment3: "Spot the Error Challenge", 
      mark3: 82 
    },
    { 
      name: "5. Mukesh", 
      assignment1: "Basic Essay Writing", 
      mark1: 72, 
      assignment2: "Grammar Quiz", 
      mark2: 68, 
      assignment3: "Spot the Error Challenge", 
      mark3: 91 
    }
  ];

  const getStars = (points) => {
    if (points >= 90) return { stars: "★★★★★", color: "green" };
    if (points >= 80) return { stars: "★★★★", color: "blue" };
    if (points >= 70) return { stars: "★★★", color: "orange" };
    if (points >= 60) return { stars: "★★", color: "orange" };
    return { stars: "★", color: "red" };
  };

  const ratingScale = [
    { points: 90, stars: "★★★★★", color: "green" },
    { points: 80, stars: "★★★★", color: "blue" },
    { points: 70, stars: "★★★", color: "orange" },
    { points: 60, stars: "★★", color: "orange" },
    { points: 50, stars: "★", color: "red" }
  ];

  const durationData = {
    labels: ['1. Hari', '2. Bala Kumar', '3. Naveen', '4. Dinesh', '5. Mukesh'],
    datasets: [{
      label: 'Total Hours',
      data: [3, 8, 12, 16, 4],
      backgroundColor: ['#f59e0b', '#3b82f6', '#3b82f6', '#10b981', '#f59e0b'],
      borderWidth: 0,
      borderRadius: {
        topRight: 10,
        bottomRight: 10,
      },
    }],
  };

  const durationOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 17,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return value;
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)',
        }
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  const overallReportsData = [
    { name: "1. Hari", currentMarks: "73.7", assignmentMarks: "60", totalDuration: "8 hours", lastLogin: "12/25 - 5:25 PM" },
    { name: "2. Bala Kumar", currentMarks: "80", assignmentMarks: "80", totalDuration: "10 hours", lastLogin: "12/25 - 5:25 PM" },
    { name: "3. Naveen", currentMarks: "67", assignmentMarks: "60", totalDuration: "8 hours", lastLogin: "12/25 - 5:25 PM" },
    { name: "4. Dinesh", currentMarks: "89.9", assignmentMarks: "80", totalDuration: "6 hours", lastLogin: "12/25 - 5:25 PM" },
    { name: "5. Mukesh", currentMarks: "85", assignmentMarks: "100", totalDuration: "8 hours", lastLogin: "12/25 - 5:25 PM" },
    { name: "6. Raj Kumar", currentMarks: "90", assignmentMarks: "80", totalDuration: "8 hours", lastLogin: "12/25 - 5:25 PM" }
  ];

  const selectedTabLabel = tabs.find(tab => tab.id === selectedTab)?.label || "Reports";

  const renderContent = () => {
    if (selectedTab === "current") {
      return (
        <div className="w-full overflow-x-auto">
          <div className="bg-white rounded-lg shadow overflow-hidden min-w-[600px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1b64a5] text-white">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">Students name in higher to lower score</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Topic-I</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Topic-II</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Topic-III</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500">
                {sortedCurrentMarksData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 border border-gray-500 border-t-0 border-l-0">{row.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{row.topic1}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{row.topic2}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{row.topic3}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">{row.average}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (selectedTab === "assignment") {
      return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1">
            <div className="w-full overflow-x-auto">
              <div className="bg-white rounded-lg shadow overflow-hidden min-w-[800px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#1b64a5] text-white">
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">Student Name</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Assignment 1</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Mark 1</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Assignment 2</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Mark 2</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Assignment 3</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Mark 3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-500">
                    {assignmentMarksData.map((row, index) => {
                      const mark1Stars = getStars(row.mark1);
                      const mark2Stars = getStars(row.mark2);
                      const mark3Stars = getStars(row.mark3);
                      return (
                        <tr key={index}>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 border border-gray-500 border-t-0 border-l-0">{row.name}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{row.assignment1}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
                            <div>
                              <div className="text-xs font-medium">{row.mark1}</div>
                              <span style={{ color: mark1Stars.color === "orange" ? "#f97316" : mark1Stars.color === "blue" ? "#3b82f6" : mark1Stars.color === "green" ? "#10b981" : "#ef4444", fontSize: "12px" }}>
                                {mark1Stars.stars.split('').map((star, sIndex) => (
                                  <span key={sIndex}>★</span>
                                ))}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{row.assignment2}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">
                            <div>
                              <div className="text-xs font-medium">{row.mark2}</div>
                              <span style={{ color: mark2Stars.color === "orange" ? "#f97316" : mark2Stars.color === "blue" ? "#3b82f6" : mark2Stars.color === "green" ? "#10b981" : "#ef4444", fontSize: "12px" }}>
                                {mark2Stars.stars.split('').map((star, sIndex) => (
                                  <span key={sIndex}>★</span>
                                ))}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">{row.assignment3}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
                            <div>
                              <div className="text-xs font-medium">{row.mark3}</div>
                              <span style={{ color: mark3Stars.color === "orange" ? "#f97316" : mark3Stars.color === "blue" ? "#3b82f6" : mark3Stars.color === "green" ? "#10b981" : "#ef4444", fontSize: "12px" }}>
                                {mark3Stars.stars.split('').map((star, sIndex) => (
                                  <span key={sIndex}>★</span>
                                ))}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-48 lg:flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">Rating Scale</h3>
              {ratingScale.map((scale, index) => (
                <div key={index} className="flex justify-between items-center text-xs text-gray-600 mb-1">
                  <span>{scale.points} points</span>
                  <span style={{ color: scale.color === "green" ? "#10b981" : scale.color === "blue" ? "#3b82f6" : scale.color === "orange" ? "#f97316" : "#ef4444" }}>
                    {scale.stars.split('').map((star, sIndex) => (
                      <span key={sIndex}>★</span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (selectedTab === "duration") {
      return (
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
            <div className="bg-[#1b64a5] text-white px-3 sm:px-6 py-3">
              <div className="flex font-semibold text-xs sm:text-sm">
                <div className="flex-1">Students Name</div>
                <div>Total Hours</div>
              </div>
            </div>
            <div className="p-3 sm:p-6 h-64 sm:h-80">
              <Bar options={durationOptions} data={durationData} />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex flex-wrap justify-around text-xs sm:text-sm text-gray-700 gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                Less than 2 hours
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                Less than 5 hours
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                Less than 10 hours
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                Less than 15 hours
              </div>
            </div>
          </div>
        </div>
      );
    } else if (selectedTab === "overall") {
      return (
        <div className="w-full overflow-x-auto">
          <div className="bg-white rounded-lg shadow overflow-hidden min-w-[600px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1b64a5] text-white">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">Student Name</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Current Marks</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Assignment Marks</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0">Total Duration</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500">
                {overallReportsData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 border border-gray-500 border-t-0 border-l-0">{row.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{row.currentMarks}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{row.assignmentMarks}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0">{row.totalDuration}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">{row.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Radio Tabs - Centered */}
      <div className="flex justify-center gap-2 lg:gap-4 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <div 
            key={tab.id} 
            className={`flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-4 bg-white rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md flex-shrink-0 min-w-[140px] lg:min-w-0 ${
              selectedTab === tab.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedTab(tab.id)}
          >
            <input
              type="radio"
              id={tab.id}
              name="reportType"
              checked={selectedTab === tab.id}
              onChange={() => setSelectedTab(tab.id)}
              className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor={tab.id} className="text-xs lg:text-sm font-medium text-gray-700 cursor-pointer">
              {tab.label}
            </label>
          </div>
        ))}
      </div>

      {/* Title and Download Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800">{selectedTabLabel}</h2>
        <button className="bg-yellow-400 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
          Download
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs">(xlsx or pdf)</span>
        </button>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default SuperAdminReports;