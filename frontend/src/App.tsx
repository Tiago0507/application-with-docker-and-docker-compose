import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { StatusPage } from './pages/StatusPage'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/"              element={<DashboardPage />} />
            <Route path="/projects"      element={<ProjectsPage />} />
            <Route path="/projects/:id"  element={<ProjectDetailPage />} />
            <Route path="/status"        element={<StatusPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
