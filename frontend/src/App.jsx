import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateGroup from './pages/CreateGroup'
import Dashboard from './pages/Dashboard'
import Settlement from './pages/Settlement'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateGroup />} />
      <Route path="/group/:groupId" element={<Dashboard />} />
      <Route path="/group/:groupId/settlement" element={<Settlement />} />
    </Routes>
  )
}

export default App
