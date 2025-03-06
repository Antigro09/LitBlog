import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';  // Dark theme
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup'; // For HTML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-csharp';
import ReactHtmlParser from 'react-html-parser';
import Loader from './components/Loader';
import './Litblogs.css';

const processHtmlForStyles = (html) => {
  // First handle colors
  let processedHtml = html.replace(
    /<span[^>]*style="[^"]*color: ?#e03e2d[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<span style="color: #e03e2d !important; display: inline !important;">$1</span>'
  );
  
  // Handle all colors
  processedHtml = processedHtml.replace(
    /<span[^>]*style="[^"]*color: ?([^;"\s]+)[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<span style="color: $1 !important; display: inline !important;">$2</span>'
  );
  
  // Handle font-family styles with stronger pattern
  processedHtml = processedHtml.replace(
    /<span[^>]*style="[^"]*font-family: ?(['"]?)([^;'"]*)(['"]?)[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<span style="font-family: $2 !important; display: inline !important;">$4</span>'
  );
  
  return processedHtml;
};

const PostView = () => {
  const { classId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => {
      const newDarkMode = !prevDarkMode;
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      return newDarkMode;
    });
  };

  useEffect(() => {
    const storedDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode);
    } else {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    // Load user info
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/api/classes/${classId}/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPost(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to load post');
        setLoading(false);
      }
    };

    fetchPost();
  }, [classId, postId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const highlight = async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        Prism.highlightAll();
      };
      highlight();
    }
  }, [post]);

  const handleBack = () => {
    if (userInfo?.role === 'TEACHER') {
      navigate('/teacher-dashboard');
    } else {
      navigate(`/class-feed/${classId}`);
    }
  };

  // Add this CSS to your richTextStyles
  const richTextStyles = `
    .prose {
      max-width: none;
    }
    
    .prose * {
      font-family: inherit;
    }

    /* Remove Tailwind prose color overrides */
    .prose :where(p, span, div, strong, em, b, i, u, strike):not(:where([class~="not-prose"] *)) {
      color: unset !important;
    }

    /* Preserve inline styles */
    .prose [style] {
      color: unset !important;
    }

    .prose span[style*="color:"] {
      color: var(--mce-color) !important;
    }

    .prose span[style*="background-color:"] {
      background-color: var(--mce-bg) !important;
    }

    .prose span[style*="font-size:"] {
      font-size: var(--mce-size) !important;
    }

    /* Basic formatting */
    .prose u {
      text-decoration: underline !important;
    }
    
    .prose s, .prose strike, .prose del {
      text-decoration: line-through !important;
    }
    
    .prose b, .prose strong {
      font-weight: bold !important;
    }
    
    .prose i, .prose em {
      font-style: italic !important;
    }
  `;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
        >
          {/* Back Button */}
          <div className="p-4 border-b dark:border-gray-700">
            <motion.button
              onClick={handleBack}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
              whileHover={{ x: -5 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {userInfo?.role === 'TEACHER' ? 'Back to Dashboard' : 'Back to Class'}
            </motion.button>
          </div>

          {/* Post Content */}
          <div className="p-6">
            {/* Author Info */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                {post.author?.first_name?.[0] || '?'}
              </div>
              <div>
                <h3 className="font-medium text-lg dark:text-white">
                  {post.author ? `${post.author.first_name} ${post.author.last_name}` : 'Unknown Author'}
                </h3>
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Post Title and Content */}
            <h1 className="text-3xl font-bold mb-4 dark:text-white">{post.title}</h1>
            
            {/* Replace the existing content render with this */}
            <div 
              className="html-content"
              dangerouslySetInnerHTML={{ 
                __html: processHtmlForStyles(post.content) 
              }}
            />

            {/* Interactions */}
            <div className="mt-8 pt-6 border-t dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                  <span>👍</span>
                  <span>Like</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                  <span>💬</span>
                  <span>Comment</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PostView; 