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
import Loader from './components/Loader';

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

  // Helper function to render different content types
  const renderContent = (content) => {
    // Split content by custom markers
    const parts = content.split(/(\[(?:CODE|GIF|POLL|FILE|IMAGE):.+?\])/g);

    return parts.map((part, index) => {
      // Check for special content markers
      if (part.startsWith('[CODE:')) {
        const language = part.match(/\[CODE:(\w+)\]/)?.[1] || 'javascript';
        const code = part.replace(/\[CODE:\w+\]/, '').trim();
        return (
          <div key={index} className="code-snippet my-4">
            <div className="code-header">
              <span className="text-sm font-mono">{language}</span>
              <button 
                className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                onClick={() => navigator.clipboard.writeText(code)}
              >
                Copy
              </button>
            </div>
            <div className="relative">
              <pre className="!m-0 !p-4 !bg-[#2d2d2d]">
                <code className={`language-${language}`}>
                  {code}
                </code>
              </pre>
            </div>
          </div>
        );
      }
      
      if (part.startsWith('[GIF:')) {
        const url = part.match(/\[GIF:(.*?)\]/)?.[1];
        return (
          <div key={index} className="my-4">
            <img src={url} alt="GIF" className="rounded-lg max-w-full" />
          </div>
        );
      }

      if (part.startsWith('[POLL:')) {
        const options = part.match(/\[POLL:(.*?)\]/)?.[1].split(',');
        return (
          <div key={index} className="my-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-3">Poll</h3>
            <div className="space-y-2">
              {options?.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" id={`option-${i}`} name="poll" />
                  <label htmlFor={`option-${i}`}>{option.trim()}</label>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (part.startsWith('[FILE:')) {
        const [name, url] = part.match(/\[FILE:(.*?),(.*?)\]/)?.[1].split('|') || [];
        return (
          <div key={index} className="my-4">
            <a 
              href={url}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{name}</span>
            </a>
          </div>
        );
      }

      if (part.startsWith('[IMAGE:')) {
        const url = part.match(/\[IMAGE:(.*?)\]/)?.[1];
        return (
          <div key={index} className="my-4">
            <img src={url} alt="Uploaded content" className="rounded-lg max-w-full" />
          </div>
        );
      }

      // Regular text content
      return (
        <p key={index} className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
          {part}
        </p>
      );
    });
  };

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
            <div className="prose dark:prose-invert max-w-none">
              {renderContent(post.content, false)}
            </div>

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