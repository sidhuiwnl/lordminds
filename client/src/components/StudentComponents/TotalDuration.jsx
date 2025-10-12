import React from "react";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TotalDuration = () => {
  const data = {
    labels: ["Niharika"],
    datasets: [
      {
        label: "Total Hours",
        data: [5.5], // Approximate value based on the image
        backgroundColor: "rgba(234, 179, 8, 0.8)", // Yellow
        borderColor: "rgba(234, 179, 8, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y", // Horizontal bar
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide default legend
      },
    },
    scales: {
      x: {
        min: 0,
        max: 17,
        ticks: {
          stepSize: 1,
        },
        grid: {
          display: true,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6] rounded-bl-lg rounded-tr-lg">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4 lg:mb-6">Total Duration</h2>
          <div className="relative h-48 lg:h-64 mb-3 lg:mb-4">
            <div className="flex items-end justify-between mb-3 lg:mb-4">
              <span className="text-xs lg:text-sm text-gray-600 font-medium">Student Name</span>
              <span className="text-xs lg:text-sm text-gray-600 font-medium">Total Hours</span>
            </div>
            <Bar data={data} options={options} />
            <div className="flex flex-wrap justify-center gap-4 lg:space-x-8 lg:gap-0 mt-3 lg:mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-600">Less than 2 hours</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-yellow-500 rounded"></div>
                <span className="text-xs text-gray-600">Less than 5 hours</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">Less than 10 hours</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Less than 15 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalDuration;