import { useState, useEffect } from "react";
import './App.css'; // Import your styles

const LitBlogs = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [darkMode, setDarkMode] = useState(false); // Add darkMode state
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
      // Save the new darkMode setting to localStorage
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
      // If no preference is stored, fall back to system theme preference
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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      {/* Navbar */}
      <nav className="navbar z-50 shadow-2xl">
        <div className="navbar-container">
          <img src="/images/logo.png" alt="Logo" className="h-10" />
          <div className="navbar-title">LitBlogs</div>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className="h-12 w-12 text-white border-2 border-white rounded-full p-1"
            >
              <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zM178.3 304C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3z" />
            </svg>
            <a href="#" className="text-white">Sign In</a>
          </div>
        </div>
        <div className="navbar-links text-white border-black">
          <a href="home.html">Home</a>
          <a href="#">Ms. Tambellini's 10 English</a>
          <a href="#">Ms. Musk's 9 English</a>
          <a href="#">Help</a>
        </div>
      </nav>

      {/* Toggle Dark Mode Button */}
      <div className="absolute top-40 right-4 z-10">
        <button
          onClick={toggleDarkMode}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Content */}
      <section className="flex flex-col items-center pt-40 px-4">
        {/* Slider */}
        <div className="slider-container">
          <div className="slider">
            {slides.map((src, index) => (
              <div
                key={index}
                className={`slide ${currentSlide === index ? 'active' : ''}`}
                style={{ backgroundImage: `url(${src})` }}
              ></div>
            ))}
          </div>
          <button onClick={prevSlide} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-700 p-2 text-white">&#10094;</button>
          <button onClick={nextSlide} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 p-2 text-white">&#10095;</button>
          <div className="indicators">
            {slides.map((_, index) => (
              <div key={index} className={`indicator ${currentSlide === index ? 'active' : ''}`}></div>
            ))}
          </div>
        </div>

        {/* Welcome Message */}
        <div className="welcome-text">
          <h2 className="text-2xl font-bold">Welcome to LitBlog!</h2>
          <p className="mt-2">Step into a world of literature and technology with LitBlog, a dynamic platform inspired by Mrs. Tambellini's English 10A-CIT class!</p>
          <p className="mt-2">Developed by students from the Center for Information Technology (CIT), LitBlog fosters creativity and connection among students throughout their literary endeavors.</p>
        </div>
      </section>

      {/* Teachers Section */}
      <section className="p-6">
        {[{ name: "Ms. Tambellini", img: "/images/tambellini.jpg", class: "10A CIT English" }, { name: "Ms. Musk", img: "/images/musk.jpg", class: "9A CIT English" }].map((teacher, index) => (
          <div key={index} className="flex items-center gap-6 mb-6">
            <img src={teacher.img} alt={teacher.name} className="h-32 rounded-lg" />
            <div>
              <h2 className="text-xl font-bold">{teacher.name}</h2>
              <p>Blah blah blah</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{teacher.class}</h3>
              <p>Blah blah</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-center p-4 mt-6">&copy; 2025 LitBlogs. All rights reserved.</footer>
    </div>
  );
};

export default LitBlogs;