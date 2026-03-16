import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ChallengeDetail from './pages/ChallengeDetail'
import ChallengeDone from './pages/ChallengeDone'
import MyPage from './pages/MyPage'
import VodList from './pages/VodList'
import AdminDashboard from './pages/admin/Dashboard'
import AdminChallenges from './pages/admin/Challenges'
import AdminVods from './pages/admin/Vods'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/challenge/:id" element={<ChallengeDetail />} />
        <Route path="/challenge/:id/done" element={<ChallengeDone />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/vod" element={<VodList />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/challenges" element={<AdminChallenges />} />
        <Route path="/admin/vod" element={<AdminVods />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
