// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import LoginPage from './pages/LoginPage';
// import StudentHomePage from './pages/StudentPages/StudentHomePage';
// import GrammarLessonsPage from './pages/StudentPages/GrammarLessonsPage';
// import LessonsOverviewPage from './pages/StudentPages/LessonsOverviewPage';
// import AssessmentPage from './pages/StudentPages/AssessmentPage';
// import CurrentMarksPage from './pages/StudentPages/CurrentMarksPage';
// import AssignmentMarksPage from './pages/StudentPages/AssignmentMarksPage';
// import TotalDurationPage from './pages/StudentPages/TotalDurationPage';
// import OverallResultPage from './pages/StudentPages/OverallResultPage';

// const App = () => {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LoginPage />} />
//         <Route path="/student/studenthome" element={<StudentHomePage />} />
//         <Route path="/student/grammarlessons" element={<GrammarLessonsPage />} />
//         <Route path="/student/lessonsoverview" element={<LessonsOverviewPage />} />
//         <Route path="/student/assessments" element={<AssessmentPage />} />
//         <Route path="/student/currentmarks" element={<CurrentMarksPage />} />
//         <Route path="/student/assignmentmarks" element={<AssignmentMarksPage />} />
//         <Route path="/student/totalduration" element={<TotalDurationPage />} />
//         <Route path="/student/overallresult" element={<OverallResultPage />} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;












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

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/student/studenthome" element={<StudentHomePage />} />
        <Route path="/student/grammarlessons" element={<GrammarLessonsPage />} />
        <Route path="/student/lessonsoverview" element={<LessonsOverviewPage />} />
        <Route path="/student/assessments" element={<AssessmentPage />} />
        <Route path="/student/currentmarks" element={<CurrentMarksPage />} />
        <Route path="/student/assignmentmarks" element={<AssignmentMarksPage />} />
        <Route path="/student/totalduration" element={<TotalDurationPage />} />
        <Route path="/student/overallresult" element={<OverallResultPage />} />

        {/* superadmin routes */}
        <Route path="/superadmin/superadminhome" element={<SuperAdminHomePage />} />
        <Route path="/superadmin/reports" element={<SuperAdminReportsPage />} />
        <Route path="/superadmin/uploads" element={<SuperAdminUploadPage />} />
        <Route path="/superadmin/access-creation" element={<SuperAdminAccessCreationPage />} />

      </Routes>
    </Router>
  );
};

export default App;