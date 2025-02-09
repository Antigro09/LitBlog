import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LitBlogs from "./LitBlogs";
import Tambellini from "./Tambellini";
import Musk from "./Musk";
import Help from "./Help";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LitBlogs />} />
        <Route path="/tambellini" element={<Tambellini />} />
        <Route path="/musk" element={<Musk />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  );
}

export default App;