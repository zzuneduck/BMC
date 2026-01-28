import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import { StudentLayout, AdminLayout } from './layouts';
import { MainPage, VOD, Mission, Blog, Instructor, Schedule, Resources, Consulting, Consultation, QnA, Earnings, Revenue, Ranking as StudentRanking, Attendance as StudentAttendance, Profile, Notice } from './pages/Student';
import {
  Dashboard,
  StudentList,
  StudentRegister,
  Attendance,
  Teams,
  Ranking,
  Forest,
  InstructorManage,
  MissionStatus,
  VODManage,
  MissionManage,
  Simulation,
  NoticeManage,
  QnAManage
} from './pages/Admin';
import { COLORS } from './utils/constants';
import './App.css';

// 준비 중 페이지
const PlaceholderPage = ({ title }) => (
  <div style={placeholderStyles.container}>
    <div style={placeholderStyles.content}>
      <span style={placeholderStyles.icon}>🚧</span>
      <h2 style={placeholderStyles.title}>{title}</h2>
      <p style={placeholderStyles.text}>페이지 준비 중입니다.</p>
    </div>
  </div>
);

const placeholderStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '20px',
  },
  content: {
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  title: {
    color: COLORS.text,
    fontSize: '20px',
    margin: '0 0 8px 0',
  },
  text: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: 0,
  },
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth 라우트 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* 기본 경로 → 로그인으로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 수강생 페이지 */}
        <Route path="/student" element={
          <StudentLayout>
            <MainPage />
          </StudentLayout>
        } />
        <Route path="/student/instructor" element={
          <StudentLayout>
            <Instructor />
          </StudentLayout>
        } />
        <Route path="/student/schedule" element={
          <StudentLayout>
            <Schedule />
          </StudentLayout>
        } />
        <Route path="/student/mission" element={
          <StudentLayout>
            <Mission />
          </StudentLayout>
        } />
        <Route path="/student/vod" element={
          <StudentLayout>
            <VOD />
          </StudentLayout>
        } />
        <Route path="/student/blog" element={
          <StudentLayout>
            <Blog />
          </StudentLayout>
        } />
        <Route path="/student/resources" element={
          <StudentLayout>
            <Resources />
          </StudentLayout>
        } />
        <Route path="/student/consulting" element={
          <StudentLayout>
            <Consulting />
          </StudentLayout>
        } />
        <Route path="/student/qna" element={
          <StudentLayout>
            <QnA />
          </StudentLayout>
        } />
        <Route path="/student/earnings" element={
          <StudentLayout>
            <Earnings />
          </StudentLayout>
        } />
        <Route path="/student/consultation" element={
          <StudentLayout>
            <Consultation />
          </StudentLayout>
        } />
        <Route path="/student/revenue" element={
          <StudentLayout>
            <Revenue />
          </StudentLayout>
        } />
        <Route path="/student/ranking" element={
          <StudentLayout>
            <StudentRanking />
          </StudentLayout>
        } />
        <Route path="/student/attendance" element={
          <StudentLayout>
            <StudentAttendance />
          </StudentLayout>
        } />
        <Route path="/student/profile" element={
          <StudentLayout>
            <Profile />
          </StudentLayout>
        } />
        <Route path="/student/notice" element={
          <StudentLayout>
            <Notice />
          </StudentLayout>
        } />

        {/* 관리자 페이지 */}
        <Route path="/admin" element={
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        } />
        <Route path="/admin/instructor" element={
          <AdminLayout>
            <InstructorManage />
          </AdminLayout>
        } />
        <Route path="/admin/students" element={
          <AdminLayout>
            <StudentList />
          </AdminLayout>
        } />
        <Route path="/admin/register" element={
          <AdminLayout>
            <StudentRegister />
          </AdminLayout>
        } />
        <Route path="/admin/attendance" element={
          <AdminLayout>
            <Attendance />
          </AdminLayout>
        } />
        <Route path="/admin/teams" element={
          <AdminLayout>
            <Teams />
          </AdminLayout>
        } />
        <Route path="/admin/mission" element={
          <AdminLayout>
            <MissionStatus />
          </AdminLayout>
        } />
        <Route path="/admin/vod" element={
          <AdminLayout>
            <VODManage />
          </AdminLayout>
        } />
        <Route path="/admin/mission-manage" element={
          <AdminLayout>
            <MissionManage />
          </AdminLayout>
        } />
        <Route path="/admin/simulation" element={
          <AdminLayout>
            <Simulation />
          </AdminLayout>
        } />
        <Route path="/admin/ranking" element={
          <AdminLayout>
            <Ranking />
          </AdminLayout>
        } />
        <Route path="/admin/forest" element={
          <AdminLayout>
            <Forest />
          </AdminLayout>
        } />
        <Route path="/admin/notice" element={
          <AdminLayout>
            <NoticeManage />
          </AdminLayout>
        } />
        <Route path="/admin/qna" element={
          <AdminLayout>
            <QnAManage />
          </AdminLayout>
        } />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
