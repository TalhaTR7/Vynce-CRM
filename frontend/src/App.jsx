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
import ProtectedRoute from "./components/ProtectedRoute";

import { useModal } from "./context/ModalContext";
import CreateProject from "./components/modals/CreateProject";
import CreateBoard from "./components/modals/CreateBoard";
import CreateTask from "./components/modals/CreateTask";


function App() {
  const { modal, closeModal } = useModal();

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
        <Route path="/settings/project/:id" element={<ProtectedRoute><ProjectSettings /></ProtectedRoute>} />
      </Routes>
      {modal?.type === "CREATE_PROJECT" && (<CreateProject onClose={closeModal} />)}
      {modal?.type === "CREATE_BOARD" && (<CreateBoard onClose={closeModal} project={modal.payload.project} />)}
      {modal?.type === "CREATE_TASK" && (<CreateTask onClose={closeModal} project={modal.payload.project} board={modal.payload.board} />)}
    </Router>
  )
}

export default App
