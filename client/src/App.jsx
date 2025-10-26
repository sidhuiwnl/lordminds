




import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudentHomePage from './pages/StudentPages/StudentHomePage';
import GrammarLessonsPage from './pages/StudentPages/GrammarLessonsPage';
import LessonsOverviewPage from './pages/StudentPages/LessonsOverviewPage';
import AssessmentPage from './pages/StudentPages/AssessmentPage';
import CurrentMarksPage from './pages/StudentPages/CurrentMarksPage';
import AssignmentMarksPage from './pages/StudentPages/AssignmentMarksPage';
import TotalDurationPage from './pages/StudentPages/TotalDurationPage';
import OverallResultPage from './pages/StudentPages/OverallResultPage';
import SuperAdminHomePage from './pages/SuperAdminPages/SuperAdminHomePage';
import SuperAdminReportsPage from './pages/SuperAdminPages/SuperAdminReportsPage';
import SuperAdminUploadPage from './pages/SuperAdminPages/SuperAdminUploadPage';
import SuperAdminAccessCreationPage from './pages/SuperAdminPages/SuperAdminAccessCreationPage';


import AdminHomePage from './pages/Administrator/AdminHomePage';
import AdminReportsPage from './pages/Administrator/AdminReportsPage';
import AdminUploadPage from './pages/Administrator/AdminUploadPage';
import AdminAccessCreationPage from './pages/Administrator/AdminAccessCreationPage';
import AssignmentPage from './pages/StudentPages/AssignmentPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student/studenthome" element={<StudentHomePage />} />
        <Route path="/student/assignment/:assignment" element={<AssignmentPage />} />
        <Route path="/student/:topic/subtopics" element={<GrammarLessonsPage />} />
        <Route path="/student/:subtopic/lessonsoverview" element={<LessonsOverviewPage />} />
        <Route path="/student/:subtopic/assessments" element={<AssessmentPage />} />
        <Route path="/student/currentmarks" element={<CurrentMarksPage />} />
        <Route path="/student/assignmentmarks" element={<AssignmentMarksPage />} />
        <Route path="/student/totalduration" element={<TotalDurationPage />} />
        <Route path="/student/overallresult" element={<OverallResultPage />} />
        <Route path="/student/grammerlessons" element={<GrammarLessonsPage />} />

        {/* superadmin routes */}
        <Route path="/superadmin/superadminhome" element={<SuperAdminHomePage />} />
        <Route path="/superadmin/reports" element={<SuperAdminReportsPage />} />
        <Route path="/superadmin/uploads" element={<SuperAdminUploadPage />} />
        <Route path="/superadmin/access-creation" element={<SuperAdminAccessCreationPage />} />

        <Route path="/admin/adminhome" element={<AdminHomePage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/uploads" element={<AdminUploadPage />} />
        <Route path="/admin/access-creation" element={<AdminAccessCreationPage />} />

      </Routes>
    </Router>
  );
};

export default App;