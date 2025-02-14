import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LitBlogs from "./LitBlogs";
import Tambellini from "./Tambellini";
import Musk from "./Musk";
import Help from "./Help";
import SignIn from "./Sign-in";
import SignUp from "./Sign-up";
import TeacherDashboard from "./TeacherDashboard";
import ClassFeed from "./ClassFeed";
import RoleSelection from "./RoleSelection";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LitBlogs />} />
        <Route path="/tambellini" element={<Tambellini />} />
        <Route path="/musk" element={<Musk />} />
        <Route path="/help" element={<Help />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/class-feed" element={<ClassFeed />} />
        <Route path="/class/:classId" element={<ClassFeed />} />
      </Routes>
    </Router>
  );
}

export default App;