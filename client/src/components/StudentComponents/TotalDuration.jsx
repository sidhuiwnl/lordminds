import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TotalDuration = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLoading(false);
      return;
    }

    const parsedUser = JSON.parse(userData);
    const userId = parsedUser.user_id;

    const fetchTotalDuration = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_API_URL}/users/totalduration/${userId}`
        );
        const data = await res.json();

        if (data.status === "success" && data.data) {
          const { student_name, total_hours } = data.data;
          setStudentName(student_name);
          setTotalHours(total_hours);

          setChartData({
            labels: [student_name],
            datasets: [
              {
                label: "Total Hours",
                data: [total_hours],
                backgroundColor: getBarColor(total_hours),
                borderColor: "rgba(0, 0, 0, 0.1)",
                borderWidth: 1,
              },
            ],
          });
        }
      } catch (err) {
        console.error("Error fetching total duration:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalDuration();
  }, []);

  // 🎨 Set bar color based on hours spent
  const getBarColor = (hours) => {
    if (hours < 2) return "rgba(239, 68, 68, 0.8)"; // 🔴 red
    if (hours < 4) return "rgba(249, 115, 22, 0.8)"; // 🟠 orange
    if (hours < 6) return "rgba(234, 179, 8, 0.8)";  // 🟡 yellow
    if (hours < 10) return "rgba(59, 130, 246, 0.8)"; // 🔵 blue
    return "rgba(34, 197, 94, 0.8)"; // 🟢 green
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        min: 0,
        max: 17,
        ticks: { stepSize: 1 },
        grid: { display: true },
      },
      y: { grid: { display: false } },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Loading total duration...
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No data found for this student.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-gray-50 mt-30 min-h-screen">
      <div className="space-y-4 lg:space-y-6 mx-0 lg:mx-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 border-t-4 border-r-4 border-[#1b65a6]">
          <h2 className="font-bold text-lg lg:text-xl text-gray-800 mb-4">
            Total Duration
          </h2>

          <div className="relative h-48 lg:h-64 mb-3">
            <div className="flex items-end justify-between mb-3">
              <span className="text-xs lg:text-sm text-gray-600 font-medium">
                Student Name
              </span>
              <span className="text-xs lg:text-sm text-gray-600 font-medium">
                Total Hours
              </span>
            </div>

            <Bar data={chartData} options={options} />

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <LegendItem color="bg-red-500" text="Less than 2 hours" />
              <LegendItem color="bg-orange-500" text="Less than 4 hours" />
              <LegendItem color="bg-yellow-400" text="Less than 6 hours" />
              <LegendItem color="bg-blue-500" text="Less than 10 hours" />
              <LegendItem color="bg-green-500" text="More than 10 hours" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔹 Legend Item Component
const LegendItem = ({ color, text }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-3 h-3 lg:w-4 lg:h-4 rounded ${color}`}></div>
    <span className="text-xs text-gray-600">{text}</span>
  </div>
);

export default TotalDuration;
