import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";


import StudentHomePage from "./pages/StudentPages/StudentHomePage";
import ViewTest from "./pages/StudentPages/ViewTest";
import LessonsOverviewPage from "./pages/StudentPages/LessonsOverviewPage";
import AssessmentPage from "./pages/StudentPages/AssessmentPage";
import CurrentMarksPage from "./pages/StudentPages/CurrentMarksPage";
import AssignmentMarksPage from "./pages/StudentPages/AssignmentMarksPage";
import TotalDurationPage from "./pages/StudentPages/TotalDurationPage";
import OverallResultPage from "./pages/StudentPages/OverallResultPage";
import AssignmentPage from "./pages/StudentPages/AssignmentPage";
import AssignmentViewTest from "./pages/StudentPages/AssignmentViewTest";
import StudentRegistrationForm from "./pages/StudentPages/OnboardPage";



import SuperAdminHomePage from "./pages/SuperAdminPages/SuperAdminHomePage";
import SuperAdminReportsPage from "./pages/SuperAdminPages/SuperAdminReportsPage";
import SuperAdminUploadPage from "./pages/SuperAdminPages/SuperAdminUploadPage";
import SuperAdminAccessCreationPage from "./pages/SuperAdminPages/SuperAdminAccessCreationPage";
import SuperAdminProfilePage from "./pages/SuperAdminPages/SuperadminProfilePage";



import AdminHomePage from "./pages/Administrator/AdminHomePage";
import AdminReportsPage from "./pages/Administrator/AdminReportsPage";
import AdminUploadPage from "./pages/Administrator/AdminUploadPage";
import AdminAccessCreationPage from "./pages/Administrator/AdminAccessCreationPage";
import AdminProfilePage from "./pages/Administrator/AdminProfilePage";


import ProtectedRoute from "./components/ProctecdRoute";
import ProfilePage from "./pages/StudentPages/ProfilePage";
import SubtopicsPage from "./pages/StudentPages/SubTopicsPage";
import TopicsPage from "./pages/StudentPages/Topics";



import AdministratorHomePage from "./pages/AdministratorPages/AdministratorHome";
import AdministratorAccessCreationPage from "./pages/AdministratorPages/AdministratorAccessCreationPage";
import AdministratorReportPage from "./pages/AdministratorPages/AdministratorReportPage";
import AdministratorProfilePage from "./pages/AdministratorPages/AdministratorProfilePage";


import TeacherHomePage from "./pages/TeacherPages/TeacherHomePage";
import TeacherAssignmentMarkPage from "./pages/TeacherPages/TeacherAssignmentMarkPage";
import TeacherCurrentMarkPage from "./pages/TeacherPages/TeacherCurrentMarksPage";
import TeacherDurationPage from "./pages/TeacherPages/TeacherDurationPage";
import TeacherOverallResultPage from "./pages/TeacherPages/TeacherOverallResultPage";
import TeacherProfilePage from "./pages/TeacherPages/TeacherProfilePage";

const App = () => {
  return (
    <Router>
      <Routes>
       
        <Route path="/" element={<LoginPage />} />

        <Route path="/onboard" element = {<StudentRegistrationForm />} />

        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student/studenthome" element={<StudentHomePage />} />
          <Route path="/student/assignment/:assignment" element={<AssignmentPage />} />
          <Route path="/student/:topic/subtopics" element={<SubtopicsPage />} />
          <Route path="/student/:sub_topic_id/view-test" element={<ViewTest />} />
          <Route path="/student/assignment/:assignment_id/view-test" element={<AssignmentViewTest />} />
          <Route path="/student/:subtopic/lessonsoverview" element={<LessonsOverviewPage />} />
          <Route path="/student/:subtopic/assessments" element={<AssessmentPage />} />
          <Route path="/student/currentmarks" element={<CurrentMarksPage />} />
          <Route path="/student/assignmentmarks" element={<AssignmentMarksPage />} />
          <Route path="/student/totalduration" element={<TotalDurationPage />} />
          <Route path="/student/overallresult" element={<OverallResultPage />} />
          <Route path="/student/topics" element={<TopicsPage />} />
          <Route path="/student/profilepage" element={<ProfilePage />} />
        </Route>

        
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/adminhome" element={<AdminHomePage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/uploads" element={<AdminUploadPage />} />
          <Route path="/admin/access-creation" element={<AdminAccessCreationPage />} />
          <Route path="/admin/profilepage" element={<AdminProfilePage />} />
        </Route>

       
        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route path="/superadmin/superadminhome" element={<SuperAdminHomePage />} />
          <Route path="/superadmin/reports" element={<SuperAdminReportsPage />} />
          <Route path="/superadmin/uploads" element={<SuperAdminUploadPage />} />
          <Route path="/superadmin/access-creation" element={<SuperAdminAccessCreationPage />} />
          <Route path="/superadmin/profilepage" element={<SuperAdminProfilePage />} />
        </Route>


        <Route element={<ProtectedRoute allowedRoles={["administrator"]} />}>
          <Route path="/administrator/administratorhome" element={<AdministratorHomePage />} />
          <Route path="/administrator/administratoraccess" element={<AdministratorAccessCreationPage />} />
          <Route path="/administrator/administratorreports" element={<AdministratorReportPage />} />
          <Route path="/administrator/profilepage" element={<AdministratorProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route path="/teacher/teacherhome" element={<TeacherHomePage />} />
          <Route path="/teacher/currentmarks" element={<TeacherCurrentMarkPage />} />
          <Route path="/teacher/assignmentmarks" element={<TeacherAssignmentMarkPage />} />
          <Route path="/teacher/totalduration" element={<TeacherDurationPage />} />
          <Route path="/teacher/overallresult" element={<TeacherOverallResultPage />} />
          <Route path="/teacher/profilepage" element={<TeacherProfilePage />} />
        </Route>

        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
