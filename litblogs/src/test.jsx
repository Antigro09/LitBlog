import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import './LitBlogs.css'; // Import any custom styles here

const SignIn = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => {
      const newDarkMode = !prevDarkMode;
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      return newDarkMode;
    });
  };

  // Load dark mode preference from localStorage
  useEffect(() => {
    const storedDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode);
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

  // Apply dark mode styles to the document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      setMessage("Successfully signed in!");
    } else {
      setMessage("Please fill in both fields.");
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
    {/* Navbar */}
    <nav className="navbar z-50 fixed top-4 left-1/2 transform -translate-x-1/2 w-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md py-2 px-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center gap-6 whitespace-nowrap">
        {/* Logo */}
        <motion.img
          src="/logo.png"
          alt="Logo"
          className="h-8 transition-transform duration-300 hover:scale-110 cursor-pointer"
          whileHover={{ scale: 1.1 }}
        />
      </div>
    </nav>

    {/* Dark Mode Button */}
    <motion.div
      className="absolute top-32 right-4 z-10 transition-transform transform hover:scale-110"
      whileHover={{ scale: 1.1 }}
    >
      <button
        onClick={toggleDarkMode}
        className="bg-gray-700 text-white p-2.5 rounded-full shadow-lg transition-transform duration-300 hover:bg-gray-600"
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </motion.div>

    {/* Sign-In Form */}
    <section className="flex justify-center items-center min-h-screen px-6">
      <motion.div
        className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-200">
          Sign In
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 mt-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 mt-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full py-3 rounded-md text-white ${darkMode ? 'bg-teal-700 hover:bg-teal-600' : 'bg-blue-600 hover:bg-blue-700'} transition-colors duration-300`}
          >
            Sign In
          </button>
          {message && (
            <motion.p
              className="mt-4 text-center text-sm text-gray-500 dark:text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {message}
            </motion.p>
          )}
        </form>
      </motion.div>
    </section>

    {/* Footer */}
    <footer className={`mt-12 ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gradient-to-r from-gray-100 to-gray-100 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-gray-400">
          &copy; 2025 LitBlogs. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
  );
};

export default SignIn;