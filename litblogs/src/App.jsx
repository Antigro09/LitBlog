import { useState, useEffect, useRef } from "react";
import './App.css'; // Import your styles

const LitBlogs = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const slides = [
    "/images/logo.png",
    "/images/Among%20us.PNG",
    "/images/logo.png",
    "/images/classroom2.jpg",
  ];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Scroll-triggered animations
  const welcomeRef = useRef(null);
  const teachersRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    if (welcomeRef.current) observer.observe(welcomeRef.current);
    if (teachersRef.current) observer.observe(teachersRef.current);

    return () => {
      if (welcomeRef.current) observer.unobserve(welcomeRef.current);
      if (teachersRef.current) observer.unobserve(teachersRef.current);
    };
  }, []);

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      {/* Navbar */}
      <nav className="navbar z-50 fixed top-4 left-1/2 transform -translate-x-1/2 w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-2 px-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-6 whitespace-nowrap">
          {/* Logo */}
          <img
            src="/images/logo.png"
            alt="Logo"
            className="h-8 transition-transform duration-300 hover:scale-110 cursor-pointer"
          />

          {/* Links (Visible on Larger Screens) */}
          <div className="hidden md:flex items-center gap-6">
          <a href="#" className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}>
            Home
          </a>
          <a href="#" className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}>
            Ms. Tambellini’s 10 English
          </a>
          <a href="#" className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}>
            Ms. Musk’s 9 English
          </a>
          <a href="#" className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}>
            Help
          </a>
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
            <div
              className={`absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2 transition-all duration-300 ${
                isDropdownOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <a
                href="#"
                className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
              >
                Home
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
              >
                Ms. Tambellini’s 10 English
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
              >
                Ms. Musk’s 9 English
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
              >
                Help
              </a>
            </div>
          </div>

          {/* Sign In Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            className={`h-6 w-6 p-1 border-2 rounded-full cursor-pointer transition-all duration-300 ${
              darkMode ? 'fill-white border-white hover:bg-gray-700' : 'fill-gray-900 border-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zM178.3 304C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3z" />
          </svg>
        </div>
      </nav>

      {/* Toggle Dark Mode Button */}
      <div className="absolute top-32 right-4 z-10 transition-transform transform hover:scale-110">
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white p-2.5 rounded-full shadow-lg transition-transform duration-300 hover:bg-gray-700"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Content */}
      <section className="flex flex-col items-center pt-32 px-4 md:px-10 space-y-16">
        {/* Slider */}
        <div className="slider-container relative w-full h-72 md:h-96 overflow-hidden rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all">
          <div className="slider">
            {slides.map((src, index) => (
              <div
                key={index}
                className={`slide absolute w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
                style={{ backgroundImage: `url(${src})` }}
              ></div>
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
                className={`indicator w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${currentSlide === index ? 'scale-110 opacity-100' : 'scale-75 opacity-50'} ${darkMode ? 'bg-white' : 'bg-gray-800'}`}
                onClick={() => setCurrentSlide(index)}
              ></div>
            ))}
          </div>
        </div>

        {/* Welcome Message */}
        <div ref={welcomeRef} className="welcome-text text-center md:text-left max-w-4xl mx-auto opacity-0">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Welcome to LitBlog!
          </h2>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            Step into a world of literature and technology with LitBlog, a dynamic platform inspired by Mrs. Tambellini's English 10A-CIT class!
          </p>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            Developed by students from the Center for Information Technology (CIT), LitBlog fosters creativity and connection among students throughout their literary endeavors.
          </p>
        </div>
      </section>

      {/* Teachers Section */}
      <section ref={teachersRef} className="p-10 bg-gray-100 dark:bg-gray-800 opacity-0">
        {[{ name: "Ms. Tambellini", img: "/images/tambellini.jpg", class: "10A CIT English" }, { name: "Ms. Musk", img: "/images/musk.jpg", class: "9A CIT English" }].map((teacher, index) => (
          <div key={index} className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105">
            <img src={teacher.img} alt={teacher.name} className="h-32 w-32 object-cover rounded-lg shadow-md transition-all" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.name}</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">{teacher.class}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className={`text-center py-6 mt-12 transition-all duration-300 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gradient-to-r from-gray-100 to-gray-100 text-gray-900'}`}>
        &copy; 2025 LitBlogs. All rights reserved.
      </footer>
    </div>
  );
};

export default LitBlogs;