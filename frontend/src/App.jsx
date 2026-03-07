import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import './index.css';
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Project from "./pages/Project";
import Task from "./pages/Task";
import Chat from "./pages/Chat";
import UserSettings from "./pages/UserSettings";
import ProjectSettings from "./pages/ProjectSettings";
import Leaderboards from "./pages/Leaderboards";
import Shop from "./pages/Shop";

import { ProtectedLayout } from "./context/ProtectedLayout";
import { ProtectedRoute } from "./context/ProtectedRoute";
import ModalRenderer from "./context/ModalRenderer";


function App() {

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ className: "my-toast" }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/project/:id" element={<Project />} />
          <Route path="/task/:id" element={<Task />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/settings/user/:tab?" element={<UserSettings />} />
          <Route path="/settings/project/:id/:tab?" element={<ProjectSettings />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/shop" element={<Shop />} />
        </Route>
      </Routes>
      <ModalRenderer />
    </Router>
  )
}


export default App
