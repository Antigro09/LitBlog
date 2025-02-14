import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import './LitBlogs.css'; // Import your styles

const LitBlogs = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const dropdownRef = useRef(null);
  const slides = [
    "/Classroom1.jpeg",
    "/Classroom2.jpeg",
    "/Classroom3.jpeg",
    "/Classroom4.jpeg",
  ];

  // Handle next and previous slides
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => {
      const newDarkMode = !prevDarkMode;
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      return newDarkMode;
    });
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Apply the dark mode class to the document when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handle newsletter submission
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setNewsletterMessage("Thank you for subscribing!");
      setEmail("");
    } else {
      setNewsletterMessage("Please enter a valid email address.");
    }
  };
  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      {/* Navbar */}
      <nav className="navbar z-50 fixed top-4 left-1/2 transform -translate-x-1/2 w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-2 px-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-6 whitespace-nowrap">
          {/* Logo */}
          <Link to="/">
            <motion.img
              src="/logo.png"
              alt="Logo"
              className="h-8 transition-transform duration-300 hover:scale-110 cursor-pointer"
              whileHover={{ scale: 1.1 }}
            />
          </Link>

          {/* Links (Visible on Larger Screens) */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
            >
              Home
            </Link>
            <Link
              to="/tambellini"
              className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
            >
              Ms. Tambellini’s English 10
            </Link>
            <Link
              to="/musk"
              className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
            >
              Ms. Musk’s English 9
            </Link>
            <Link
              to="/help"
              className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
            >
              Help
            </Link>
          </div>

          {/* Dropdown Menu (Visible on Smaller Screens) */}
          <div className="md:hidden relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="text-gray-900 dark:text-white hover:text-blue-500 transition-colors duration-300 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 transition-transform duration-300 ${isDropdownOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2"
                >
                  <Link
                    to="/"
                    className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Home
                  </Link>
                  <Link
                    to="/tambellini"
                    className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Ms. Tambellini’s 10 English
                  </Link>
                  <Link
                    to="/musk"
                    className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Ms. Musk’s 9 English
                  </Link>
                  <Link
                    to="/help"
                    className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Help
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sign In Icon */}
          <Link to="/sign-in">
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className={`h-6 w-6 p-1 border-2 rounded-full cursor-pointer transition-all duration-300 ${
                darkMode
                  ? 'fill-white border-white hover:bg-gray-700'
                  : 'fill-gray-900 border-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.1 }}
            >
              <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zM178.3 304C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3z" />
            </motion.svg>
          </Link>
        </div>
      </nav>

      {/* Toggle Dark Mode Button */}
      <motion.div
        className="absolute top-5 right-4 z-10 transition-transform transform hover:scale-110"
        whileHover={{ scale: 1.1 }}
      >
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        >
          {darkMode ? "🌞" : "🌙"}
        </button>
      </motion.div>

      {/* Content */}
      <section className="py-24 text-center overflow-visible">
        <motion.h2
          className="relative -top-2 text-5xl md:text-7xl font-bold mb-4 bg-gradient-text bg-clip-text text-transparent pt-2 pb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Lit Up Your Thoughts
        </motion.h2>
        <motion.p
          className="text-gray-600 dark:text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Collaborate with creative minds. Publish your stories, engage with readers, and join a thriving community of writers.
        </motion.p>
        <Link to="/sign-in">
        <motion.button
          className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg flex items-center mx-auto shadow-lg"
          whileHover={{
            scale: 1.05,
            backgroundColor: "#2563eb",
            transition: { duration: 0.2 } // Fast transition for hover
          }}
          whileTap={{
            scale: 0.95,
            transition: { duration: 0.1 } // Fast transition for tap
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            scale: { type: "spring", stiffness: 500, damping: 30 }, // Set transition for scaling
            opacity: { duration: 0.8, delay: 0.4 },
            y: { duration: 0.8, delay: 0.4 }
          }}
        >
          Start Writing Now
          <svg className="w-5 h-5 ml-2 animate-bounce-horizontal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </motion.button>
        </Link>
      </section>

      {/* Slider */}
      <div className="flex items-center justify-center">
        <motion.div
          className="slider-container relative w-[80%] md:w-[90%] max-w-[1200px] h-[600px] overflow-hidden rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="slider">
            {slides.map((src, index) => (
              <motion.div
                key={index}
                className={`slide absolute w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
                style={{ backgroundImage: `url(${src})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: currentSlide === index ? 1 : 0 }}
                transition={{ duration: 0.8 }}
              ></motion.div>
            ))}
          </div>

          {/* Left and Right Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-700/80 p-2 text-white rounded-full hover:bg-gray-600 transition-all"
          >
            &#10094;
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-700/80 p-2 text-white rounded-full hover:bg-gray-600 transition-all"
          >
            &#10095;
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`indicator w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${currentSlide === index ? 'scale-110 opacity-100' : 'scale-75 opacity-50'} bg-white`}
                onClick={() => setCurrentSlide(index)}
              ></div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Teachers Section */}
      <section className="bg-gray-100 dark:bg-gray-800 mt-20">
          <motion.div
            className="pt-12 text-4xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              scale: { type: "spring", stiffness: 500, damping: 50 },
              opacity: { duration: 0.8, delay: 0.4 },
              y: { duration: 0.8, delay: 0.4 }
            }}
          >
            <div className="text-center">Meet the Supervisors</div>
          </motion.div>
  </section>
      <section className="p-10 bg-gray-100 dark:bg-gray-800">
        {[{ name: "Ms. Tambellini", img: "/images/tambellini.jpg", class: "10A CIT English" }, { name: "Ms. Musk", img: "/images/musk.jpg", class: "9A CIT English" }].map((teacher, index) => (
          <motion.div
            key={index}
            className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg"
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.1 } // Fast transition for hover
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              scale: { type: "spring", stiffness: 500, damping: 50 }, // Set transition for scaling
              opacity: { duration: 0.8, delay: 0.4 },
              y: { duration: 0.8, delay: 0.4 }
            }}
          >
            <img src={teacher.img} alt={teacher.name} className="h-32 w-32 object-cover rounded-lg shadow-md transition-all" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.name}</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">{teacher.class}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Newsletter Section */}
      <motion.section
        className={`py-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} text-${darkMode ? 'white' : 'gray-900'} rounded-3xl`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Writing Community</h2>
          <p className={`text-${darkMode ? 'gray-400' : 'gray-600'} mb-8`}>
            Get weekly writing tips, industry insights, and exclusive content.
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex flex-col md:flex-row gap-4 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`flex-1 px-6 py-3 rounded-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            <motion.button
              type="submit"
              className={`px-8 py-3 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-full transition-colors`}
              whileHover={{
                scale: 1.05,
                backgroundColor: "#1d4ed8",
                transition: { duration: 0.2 } // Fast transition for hover
              }}
              whileTap={{
                scale: 0.95,
                transition: { duration: 0.1 } // Fast transition for tap
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                scale: { type: "spring", stiffness: 500, damping: 50 }, // Set transition for scaling
                opacity: { duration: 0.8, delay: 0.4 },
                y: { duration: 0.8, delay: 0.4 }
              }}
            >
              Subscribe
            </motion.button>
          </form>
          {newsletterMessage && (
            <motion.p
              className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {newsletterMessage}
            </motion.p>
          )}
        </div>
      </motion.section>
      {/* Footer */}
      <footer className={`mt-12 transition-all duration-300 ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gradient-to-r from-gray-100 to-gray-100 text-gray-900'}`}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            {/* LitBlog Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">LitBlog</h3>
              <p className="text-gray-400">Connecting writers and readers worldwide</p>
            </div>
            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400">Guides</a></li>
                <li><a href="#" className="hover:text-blue-400">Tutorials</a></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400">About</a></li>
              </ul>
            </div>
          </div>
          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
            &copy; 2025 LitBlogs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LitBlogs;
