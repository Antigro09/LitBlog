import { useState, useEffect } from "react";
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

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-r from-indigo-600 to-pink-600 text-gray-900'}`}>
      {/* Navbar */}
      <nav className="navbar z-50 shadow-xl px-6 py-4 backdrop-blur-lg fixed top-0 left-0 right-0">
        <div className="navbar-container flex items-center justify-between">
          <img src="/images/logo.png" alt="Logo" className="h-12 transition-all duration-300 hover:scale-110" />
          <div className="navbar-title text-2xl font-bold text-white">LitBlogs</div>
          <div className="flex items-center gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className="h-10 w-10 text-white border-2 border-white rounded-full p-2 cursor-pointer hover:scale-110 transition-transform duration-300"
            >
              <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zM178.3 304C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3z" />
            </svg>
            <a href="#" className="text-white hover:underline">Sign In</a>
          </div>
        </div>
        <div className="navbar-links w-screen left-5 text-white">
          <a href="home.html" className="hover:text-gray-400 transition-all">Home</a>
          <a href="#" className="hover:text-gray-400 transition-all">Ms. Tambellini's 10 English</a>
          <a href="#" className="hover:text-gray-400 transition-all">Ms. Musk's 9 English</a>
          <a href="#" className="hover:text-gray-400 transition-all">Help</a>
        </div>
      </nav>

      {/* Toggle Dark Mode Button */}
      <div className="absolute top-40 right-4 z-10 transition-transform transform hover:scale-110">
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white p-3 rounded-full shadow-lg transition-transform duration-300"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Content */}
      <section className="flex flex-col items-center pt-40 px-4 md:px-10 space-y-16">
        {/* Slider */}
        <div className="slider-container relative w-full h-72 md:h-96 overflow-hidden rounded-lg shadow-lg border border-transparent transition-all">
          <div className="slider">
            {slides.map((src, index) => (
              <div
                key={index}
                className={`slide relative w-full h-full bg-cover bg-center transition-all duration-1000 ${currentSlide === index ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                style={{ backgroundImage: `url(${src})` }}
              ></div>
            ))}
          </div>
          <button onClick={prevSlide} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-700 p-3 text-white rounded-full hover:bg-gray-600 transition-all">
            &#10094;
          </button>
          <button onClick={nextSlide} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 p-3 text-white rounded-full hover:bg-gray-600 transition-all">
            &#10095;
          </button>
          <div className="indicators flex justify-center gap-2 mt-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`indicator w-3 h-3 bg-white rounded-full cursor-pointer ${currentSlide === index ? 'scale-110' : 'scale-75'} transition-all`}
                onClick={() => setCurrentSlide(index)}
              ></div>
            ))}
          </div>
        </div>

        {/* Welcome Message */}
        <div className="welcome-text text-center md:text-left max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white animate__animated animate__fadeIn">
            Welcome to LitBlog!
          </h2>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 animate__animated animate__fadeIn animate__delay-1s">
            Step into a world of literature and technology with LitBlog, a dynamic platform inspired by Mrs. Tambellini's English 10A-CIT class!
          </p>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 animate__animated animate__fadeIn animate__delay-1.5s">
            Developed by students from the Center for Information Technology (CIT), LitBlog fosters creativity and connection among students throughout their literary endeavors.
          </p>
        </div>
      </section>

      {/* Teachers Section */}
      <section className="p-10 bg-gray-100 dark:bg-gray-800">
        {[{ name: "Ms. Tambellini", img: "/images/tambellini.jpg", class: "10A CIT English" }, { name: "Ms. Musk", img: "/images/musk.jpg", class: "9A CIT English" }].map((teacher, index) => (
          <div key={index} className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg transform transition-transform duration-300 hover:scale-105">
            <img src={teacher.img} alt={teacher.name} className="h-32 rounded-lg shadow-md transition-all" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{teacher.name}</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mt-2">{teacher.class}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-center py-6 mt-12 text-white">
        &copy; 2025 LitBlogs. All rights reserved.
      </footer>
    </div>
  );
};

export default LitBlogs;