import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './LitBlogs.css'; // Import your styles

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const faqItems = [
    {
      question: "How can I join my teacher’s class?",
      answer: "Use the provided teacher code in the sign-up menu to join the class.",
      image: ""
    },
    {
      question: "How to Sign up?",
      answer: (
        <>
          <span className="flex items-center gap-2 mb-3">
            <span className="p-2 bg-purple-100 rounded-lg transition-transform hover:scale-105">
              <ImagePlaceholder />
            </span>
            Click here
          </span>
          Then click "Don't have an account? Sign Up". Enter the information and click sign up.
        </>
      )
    },
    {
      question: "How to navigate through the website?",
      answer: "There is a video linked in the help page which should help users with navigation.",
      action: (
        <button className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg transition-transform hover:scale-105">
          Visit Help Page
        </button>
      )
    },
    {
      question: "I forgot my password. What do I do?",
      answer: 'Click "Forgot password" on the login page and follow the instructions from there.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h1>

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className="p-6 cursor-pointer flex justify-between items-center transition-transform hover:scale-[1.01]"
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              >
                <h3 className="text-lg font-semibold text-gray-800">{item.question}</h3>
                <span className={`transform transition-transform duration-300 ${
                  activeIndex === index ? 'rotate-180' : 'rotate-0'
                } text-purple-600`}>
                  ▼
                </span>
              </div>

              <div className={`overflow-hidden ${
                activeIndex === index ? 'animate-slide-down' : 'animate-slide-up'
              }`}>
                <div className="px-6 pb-6 pt-0 border-t border-gray-100">
                  <div className="text-gray-600 space-y-4">
                    {typeof item.answer === 'string' ? (
                      <p>{item.answer}</p>
                    ) : (
                      item.answer
                    )}
                    
                    {item.image && (
                      <div className="mt-4 rounded-lg overflow-hidden animate-scale-in">
                        <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center transition-transform hover:scale-105">
                          <span className="text-gray-500">Image placeholder</span>
                        </div>
                      </div>
                    )}
                    
                    {item.action && item.action}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ImagePlaceholder = () => (
  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default FAQs;