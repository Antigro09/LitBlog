import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode handling
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  useEffect(() => {
    const storedDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (storedDarkMode !== null) setDarkMode(storedDarkMode);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const faqItems = [
    {
      question: "How can I join my teacher’s class?",
      answer: "Use the provided teacher code in the sign-up menu to join the class.",
      image: "/faq1.png"
    },
    {
      question: "How to Sign up?",
      answer: (
        <div className="space-y-4 pt-2">
          <div className="flex items-center">
            <button className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg transition-transform hover:scale-105" onClick={() => window.location.href = '/Sign-in'}>
Click here        </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Then click "Don't have an account? Sign Up". Enter the information and click sign up.
          </p>
        </div>
      )
    },    
    {
      question: "How to navigate through the website?",
      answer: (
        <div className="pt-2">
          There is a video linked in the help page which should help users with navigation.
        </div>
      ),
      action: (
        <button className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg transition-transform hover:scale-105" onClick={() => window.location.href = '/Help'}>
          Visit Help Page
        </button>
      )
    },    
    {
      question: "I forgot my password. What do I do?",
      answer: (
        <div className="pt-2">
          Click "Forgot password" on the login page and follow the instructions from there.
        </div>
      ),
    }
    
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 z-50 p-2 rounded-full bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800 shadow-lg hover:scale-110 transition-transform"
        >
          {darkMode ? "🌞" : "🌙"}
        </button>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
        >
          Frequently Asked Questions
        </motion.h1>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}
            >
              <div
                className="p-6 cursor-pointer flex justify-between items-center hover:bg-opacity-50 transition-all"
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              >
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {item.question}
                </h3>
                <span className={`transform transition-transform duration-300 ${
                  activeIndex === index ? 'rotate-180' : 'rotate-0'
                } ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  ▼
                </span>
              </div>

              {activeIndex === index && (
                <div className={`px-6 pb-6 pt-0 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className={`space-y-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {typeof item.answer === 'string' ? (
                      <p>{item.answer}</p>
                    ) : (
                      item.answer
                    )}
                    
                    {item.image && (
                      <div className="mt-4 rounded-lg overflow-hidden">
                        <img 
                          src={item.image} 
                          alt="Visual instruction" 
                        />
                      </div>
                    )}
                    
                    {item.action && item.action}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQs;