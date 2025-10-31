import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute Component
 * ------------------------
 * Usage:
 * <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
 *   <Route path="/student/studenthome" element={<StudentHome />} />
 * </Route>
 */

const ProtectedRoute = ({ allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role-based access check (optional)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If authenticated and authorized → render the nested route
  return <Outlet />;
};

export default ProtectedRoute;
