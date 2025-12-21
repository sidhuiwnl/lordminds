import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

/* ------------------ Searchable Dropdown Component ------------------ */
const SearchableDropdown = ({ options, value, onChange, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) setSearch(""); // Clear search when opening
    }
  };

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch("");
  };

  const handleSearchChange = (e) => setSearch(e.target.value);

  const handleClose = () => {
    setIsOpen(false);
    setSearch("");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest(".dropdown-container")) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative dropdown-container">
      <div className="relative">
        <input
          type="text"
          readOnly
          value={selectedOption ? selectedOption.label : ""}
          onClick={handleToggle}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${disabled
              ? "bg-gray-100 cursor-not-allowed"
              : "focus:ring-blue-500 border-gray-300 cursor-pointer hover:border-gray-400"
            }`}
          placeholder={placeholder}
          disabled={disabled}
        />
        <svg
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""
            } ${disabled ? "text-gray-400" : "text-gray-500"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full px-3 py-2 border-b border-gray-300 text-sm focus:outline-none"
          />
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------ Edit Student Modal ------------------ */
const EditStudentModal = ({ student, onClose, onUpdateSuccess }) => {
  const [fullName, setFullName] = useState(student.full_name);
  const [username, setUsername] = useState(student.username);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();

    if (fullName !== student.full_name) formData.append("full_name", fullName);
    if (username !== student.username) formData.append("username", username);
    if (password.trim() !== "") formData.append("password", password);

    if (
      !formData.has("full_name") &&
      !formData.has("username") &&
      !formData.has("password")
    ) {
      setError("No changes detected.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_API_URL}/student/update/${student.user_id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.status === "success") {
        toast.success(res.data.message || "Student updated successfully!");
        onUpdateSuccess(); // This will reload the page
        onClose();
      } else {
        setError(res.data.detail || "Update failed.");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setError(err.response?.data?.detail || "Unexpected error during update.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-full max-w-md mx-4 border border-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Edit Student: {student.full_name}
        </h3>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password (optional)
            </label>
            <input
              type="password"
              id="password"
              placeholder="Leave blank to keep same password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Buttons */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
              rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm 
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ------------------ Student Table ------------------ */
export const StudentTable = ({
  students,
  colleges,
  studentDepartments,
  selectedCollegeFilter,
  setSelectedCollegeFilter,
  selectedDepartmentFilter,
  setSelectedDepartmentFilter,
  rowsPerPage = 10,
  onPageChange,
}) => {
  const [studentPage, setStudentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleUpdateSuccess = () => {
    toast.success("Student updated successfully!");
    setIsModalOpen(false);
    // Reload the page after successful update
    window.location.reload();
  };

  useEffect(() => {
    if (onPageChange) onPageChange("student", studentPage);
  }, [studentPage]);

  /* 🔍 Combine existing filters + search */
  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          (!selectedCollegeFilter ||
            student.college_name === selectedCollegeFilter) &&
          (!selectedDepartmentFilter ||
            student.department_name === selectedDepartmentFilter) &&
          (student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.department_name.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [students, selectedCollegeFilter, selectedDepartmentFilter, searchQuery]
  );

  const studentTotal = filteredStudents.length;
  const studentTotalPages = Math.ceil(studentTotal / rowsPerPage);
  const paginatedStudents = useMemo(
    () =>
      filteredStudents.slice(
        (studentPage - 1) * rowsPerPage,
        studentPage * rowsPerPage
      ),
    [filteredStudents, studentPage]
  );

  const studentStartIdx = (studentPage - 1) * rowsPerPage + 1;
  const studentEndIdx = Math.min(studentPage * rowsPerPage, studentTotal);

  // Options for searchable dropdowns
  const collegeOptions = useMemo(
    () => colleges.map((college) => ({ value: college.name, label: college.name })),
    [colleges]
  );

  const departmentOptions = useMemo(
    () =>
      studentDepartments.map((dept) => ({
        value: dept.department_name,
        label: dept.department_name,
      })),
    [studentDepartments]
  );

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (student) => {
    // Confirm popup
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${student.full_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_API_URL}/student/delete/${student.user_id}`
      );

      if (res.data.status === "success") {
        Swal.fire({
          toast: true,
          icon: "success",
          title: `${student.full_name} deleted successfully!`,
          position: "top-end",
          showConfirmButton: false,
          timer: 1800,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        Swal.fire({
          toast: true,
          icon: "error",
          title: res.data.detail || "Failed to delete student.",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (err) {
      console.error("Delete error:", err);

      Swal.fire({
        toast: true,
        icon: "error",
        title: "Unexpected error while deleting student.",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };


  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
      {/* Filters */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* College Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by College
            </label>
            <SearchableDropdown
              options={collegeOptions}
              value={selectedCollegeFilter}
              onChange={(val) => {
                setSelectedCollegeFilter(val);
                setSelectedDepartmentFilter("");
                setStudentPage(1);
              }}
              placeholder="All Colleges"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Department
            </label>
            <SearchableDropdown
              options={departmentOptions}
              value={selectedDepartmentFilter}
              onChange={(val) => {
                setSelectedDepartmentFilter(val);
                setStudentPage(1);
              }}
              placeholder="All Departments"
              disabled={!selectedCollegeFilter}
            />
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student
            </label>
            <input
              type="text"
              placeholder="Search by name, username, college, or department..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setStudentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-[#1b64a5] text-white sticky top-0">
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">
                S.NO
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">
                Full Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">
                Username
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">
                College
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">
                Department
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold border border-gray-500">
                Created At
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold border border-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500">
            {paginatedStudents.map((student, index) => (
              <tr key={student.user_id}>
                <td className="px-4 py-3 border border-gray-500 text-sm">
                  {(studentPage - 1) * rowsPerPage + index + 1}
                </td>
                <td className="px-4 py-3 border border-gray-500 text-sm">
                  {student.full_name}
                </td>
                <td className="px-4 py-3 border border-gray-500 text-sm">
                  {student.username}
                </td>
                <td className="px-4 py-3 border border-gray-500 text-sm">
                  {student.college_name}
                </td>
                <td className="px-4 py-3 border border-gray-500 text-sm">
                  {student.department_name}
                </td>
                <td className="px-4 py-3 border border-gray-500 text-sm">
                  {formatDate(student.created_at)}
                </td>
                <td className="px-4 py-3 border border-gray-500 text-center">
                  <div className="flex justify-center items-center gap-3">
                    <svg
                      className="w-5 h-5 text-blue-500 cursor-pointer hover:text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={() => handleEditStudent(student)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <svg
                      className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={() => handleDeleteStudent(student)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 
                        00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {studentStartIdx} to {studentEndIdx} of {studentTotal} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStudentPage((p) => Math.max(p - 1, 1))}
            disabled={studentPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {studentPage} of {studentTotalPages}
          </span>
          <button
            onClick={() =>
              setStudentPage((p) => Math.min(p + 1, studentTotalPages))
            }
            disabled={studentPage >= studentTotalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && selectedStudent && (
        <EditStudentModal
          student={selectedStudent}
          onClose={() => setIsModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};