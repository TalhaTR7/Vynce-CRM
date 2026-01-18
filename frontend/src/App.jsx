import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Project from "./pages/Project";
import Task from "./pages/Task";
import Chat from "./pages/Chat";
import UserSettings from "./pages/UserSettings";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ className: "my-toast" }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/project/:id" element={<ProtectedRoute><Project /></ProtectedRoute>} />
        <Route path="/task/:id" element={<ProtectedRoute><Task /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/settings/user" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App
