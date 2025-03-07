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
import AdminDashboard from "./AdminDashboard";
import PostView from "./PostView";
import StudentHub from "./StudentHub";
import profile from "./profile";

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
        <Route path="/class-feed/:classId" element={<ClassFeed />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/class/:classId/post/:postId" element={<PostView />} />
        <Route path="/student-hub" element={<StudentHub />} />
        <Route path="/profile" element={<profile/>}/>
      </Routes>
    </Router>
  );
}

export default App;