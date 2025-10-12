import React from "react";

const SuperAdminHome = () => {
  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Filters - Responsive flex */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 flex-1">
          <option>Select College</option>
        </select>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 flex-1">
          <option>Select Departments</option>
        </select>
      </div>

      {/* Topics Section - Responsive grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Topics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="px-4 py-3 bg-white rounded-lg shadow border border-gray-500">
            <p className="text-sm font-medium text-gray-600 text-center">Topic 1 - Basic Grammar</p>
          </div>
          <div className="px-4 py-3 bg-white rounded-lg shadow border border-gray-500">
            <p className="text-sm font-medium text-gray-600 text-center">Topic 2 - Grammar Lessons</p>
          </div>
          <div className="px-4 py-3 bg-white rounded-lg shadow border border-gray-500">
            <p className="text-sm font-medium text-gray-600 text-center">Topic 3 - Spot the Error</p>
          </div>
          <div className="px-4 py-3 bg-white rounded-lg shadow border border-gray-500">
            <p className="text-sm font-medium text-gray-600 text-center">Topic 4 - Advanced Grammar</p>
          </div>
        </div>
      </div>

      {/* Students Table - Responsive with horizontal scroll */}
      <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-[#175d9e] text-white">
              <th className="px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-l-0">
                Students Name
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0">
                Overall Average
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs lg:text-sm font-semibold border border-gray-500 border-t-0 border-r-0">
                Last Login Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap border border-gray-500 border-t-0 border-l-0">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">1. Hari</div>
                  </div>
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0">
                78
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
                12/25 - 5:25 PM
              </td>
            </tr>
            <tr>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap border border-gray-500 border-t-0 border-l-0">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">2. Bala Kumar</div>
                  </div>
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0">
                72
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
                12/25 - 5:25 PM
              </td>
            </tr>
            <tr>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap border border-gray-500 border-t-0 border-l-0">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">3. Naveen</div>
                  </div>
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0">
                88
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
                12/25 - 5:25 PM
              </td>
            </tr>
            <tr>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap border border-gray-500 border-t-0 border-l-0">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">4. Dinesh</div>
                  </div>
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0">
                54
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
                12/25 - 5:25 PM
              </td>
            </tr>
            <tr>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap border border-gray-500 border-t-0 border-l-0">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">5. Mukesh</div>
                  </div>
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0">
                99
              </td>
              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-500 border-t-0 border-r-0">
                12/25 - 5:25 PM
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminHome;