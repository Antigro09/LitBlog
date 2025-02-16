import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid as GiphyGrid, SearchBar, SearchContext, SearchContextManager } from '@giphy/react-components';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';  // Dark theme
import 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup'; // For HTML
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';

// Add this before the ClassFeed component
const expandableListStyles = `
  .expandable-list {
    margin: 8px 0;
  }

  .expandable-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.05);
  }

  .dark .expandable-header {
    background: rgba(255, 255, 255, 0.05);
  }

  .expandable-header .arrow {
    transition: transform 0.2s;
    display: inline-block;
    font-size: 12px;
  }

  .expandable-header.collapsed .arrow {
    transform: rotate(-90deg);
  }

  .expandable-content {
    padding: 8px 8px 8px 24px;
    margin-top: 4px;
    display: block;
  }

  .expandable-header.collapsed + .expandable-content {
    display: none;
  }

  .expandable-header .title {
    font-weight: 500;
  }
`;

const codeStyles = `
  .code-snippet {
    margin: 1rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.1);
  }

  .dark .code-snippet {
    border-color: rgba(255,255,255,0.1);
  }

  .code-header {
    padding: 0.5rem 1rem;
    background: rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dark .code-header {
    background: rgba(255,255,255,0.05);
  }

  .code-snippet pre {
    margin: 0;
    padding: 1rem;
    background: rgba(0,0,0,0.02);
    overflow-x: auto;
    max-height: 250px;
    scrollbar-width: thin;
    scrollbar-color: rgba(0,0,0,0.3) transparent;
  }

  .dark .code-snippet pre {
    background: rgba(0,0,0,0.3);
    scrollbar-color: rgba(255,255,255,0.3) transparent;
  }

  .code-snippet pre::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .code-snippet pre::-webkit-scrollbar-track {
    background: transparent;
  }

  .code-snippet pre::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.3);
    border-radius: 4px;
  }

  .dark .code-snippet pre::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.3);
  }

  .code-snippet code {
    font-family: monospace;
    font-size: 0.9em;
    white-space: pre;
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #8292a2;
  }

  .token.punctuation {
    color: #f8f8f2;
  }

  .token.namespace {
    opacity: .7;
  }

  .token.property,
  .token.tag,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: #f92672;
  }

  .token.boolean,
  .token.number {
    color: #ae81ff;
  }

  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin,
  .token.inserted {
    color: #a6e22e;
  }

  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string,
  .token.variable {
    color: #f8f8f2;
  }

  .token.atrule,
  .token.attr-value,
  .token.function,
  .token.class-name {
    color: #e6db74;
  }

  .token.keyword {
    color: #66d9ef;
  }

  .token.regex,
  .token.important {
    color: #fd971f;
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }

  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }
`;

// Add this after your imports
Prism.manual = true;

const ClassFeed = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return JSON.parse(localStorage.getItem('darkMode')) ?? false;
  });
  const [newPost, setNewPost] = useState("");
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postCategory, setPostCategory] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [content, setContent] = useState('');
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [gifs, setGifs] = useState([]);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');
  const [postContent, setPostContent] = useState({
    text: "",
    media: [],
    expandableLists: [],
    codeSnippets: []
  });

  const gf = new GiphyFetch('FEzk8anVjSKZIiInlJWd4Jo4OuYBjV9B');

  useEffect(() => {
    const loadClassFeed = async () => {
      try {
        const storedClassInfo = JSON.parse(localStorage.getItem('class_info'));
        if (storedClassInfo) {
          setClassData(storedClassInfo);
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/sign-in');
          return;
        }

        const classResponse = await axios.get(`http://localhost:8000/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClassData(classResponse.data);

        const postsResponse = await axios.get(`http://localhost:8000/api/classes/${classId}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(postsResponse.data);
        setLoading(false);
      } catch (error) {
        if (error.response?.status === 403) {
          navigate('/sign-in');
        }
        setError(error.response?.data?.detail || 'Failed to load class data');
        setLoading(false);
      }
    };
    
    loadClassFeed();
  }, [classId, navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (postContent.codeSnippets.length > 0) {
      setTimeout(() => {
        Prism.highlightAll();
      }, 0);
    }
  }, [postContent.codeSnippets]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      // Format the content with code snippets
      const formattedContent = `
        ${postContent.text}
        ${postContent.codeSnippets.map(snippet => `
          <div class="code-snippet">
            <div class="code-header">
              <span class="language">${snippet.language}</span>
            </div>
            <pre><code class="${snippet.language}">
              ${snippet.code}
            </code></pre>
          </div>
        `).join('\n')}
      `;

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/classes/${classId}/posts`,
        {
          title: postTitle,
          content: formattedContent,
          media: postContent.media,
          category: postCategory,
          codeSnippets: postContent.codeSnippets
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPosts([response.data, ...posts]);
      setShowNewPostForm(false);
      setPostContent({ text: "", media: [], expandableLists: [], codeSnippets: [] });
      setPostTitle("");
      setPostCategory("");
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:8000/api/upload/image', formData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setPostContent(prev => ({
          ...prev,
          media: [...prev.media, {
            type: 'image',
            url: response.data.url,
            alt: 'Image'
          }]
        }));
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:8000/api/upload/video', formData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setPostContent(prev => ({
          ...prev,
          media: [...prev.media, {
            type: 'video',
            url: response.data.url,
            alt: 'Video'
          }]
        }));
      } catch (error) {
        console.error('Error uploading video:', error);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:8000/api/upload/file', formData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setPostContent(prev => ({
          ...prev,
          media: [...prev.media, {
            type: 'file',
            url: response.data.url,
            alt: file.name
          }]
        }));
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const insertDivider = () => {
    setPostContent(prev => ({
      ...prev,
      text: prev.text + '\n---\n'
    }));
  };

  const handleEmojiClick = (emojiData) => {
    setPostContent(prev => ({
      ...prev,
      text: prev.text + emojiData.emoji
    }));
    setShowEmojiPicker(false);
  };

  const searchGifs = async (term) => {
    try {
      const { data } = await gf.search(term, { limit: 10 });
      setGifs(data);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    }
  };

  const handleGifSelect = (gif) => {
    setPostContent(prev => ({
      ...prev,
      media: [...prev.media, {
        type: 'gif',
        url: gif.images.fixed_height.url,
        alt: 'GIF'
      }]
    }));
    setShowGifPicker(false);
    setGifs([]);
    setGifSearchTerm('');
  };

  const insertExpandableList = () => {
    setPostContent(prev => ({
      ...prev,
      expandableLists: [...prev.expandableLists, {
        id: Date.now(),
        title: "Write a title",
        content: "Add content to expand",
        isCollapsed: false
      }]
    }));
  };

  const updateExpandableList = (id, field, value) => {
    setPostContent(prev => ({
      ...prev,
      expandableLists: prev.expandableLists.map(list => 
        list.id === id ? { ...list, [field]: value } : list
      )
    }));
  };

  const handlePollSubmit = () => {
    const pollContent = `\n### Poll\n${pollOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n`;
    setPostContent(prev => ({
      ...prev,
      text: prev.text + pollContent
    }));
    setShowPollForm(false);
    setPollOptions(['', '']);
  };

  const handleCodeSubmit = () => {
    if (!codeContent.trim()) return; // Don't add empty code snippets
    
    setPostContent(prev => ({
      ...prev,
      codeSnippets: [...prev.codeSnippets, {
        id: Date.now(),
        language: codeLanguage,
        code: codeContent
      }]
    }));
    setShowCodeEditor(false);
    setCodeContent('');
    setCodeLanguage('javascript'); // Reset to default language
  };

  useEffect(() => {
    // Add the styles to the document
    const styleSheet = document.createElement("style");
    styleSheet.innerText = expandableListStyles + codeStyles;
    document.head.appendChild(styleSheet);

    // Add click handler for expandable lists
    const handleExpandableClick = (e) => {
      const header = e.target.closest('.expandable-header');
      if (header) {
        header.classList.toggle('collapsed');
      }
    };

    document.addEventListener('click', handleExpandableClick);

    return () => {
      document.removeEventListener('click', handleExpandableClick);
      styleSheet.remove();
    };
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'
      }`}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'
      }`}>
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-white' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'
    }`}>
      {/* Centered Navbar */}
      <div className="fixed top-0 left-0 right-0 flex justify-center z-50 p-4">
        <motion.nav 
          className="navbar w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-2 px-6 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
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

            {/* Navigation Links */}
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
                Tambellini
              </Link>
              <Link
                to="/musk"
                className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
              >
                Musk
              </Link>
              <Link
                to="/help"
                className={`text-gray-900 dark:text-white hover:${darkMode ? 'text-cyan-400' : 'text-blue-500'} transition-colors duration-300 text-sm md:text-base`}
              >
                Help
              </Link>
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors duration-300`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {darkMode ? "🌞" : "🌙"}
            </motion.button>

            {/* Profile Icon */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
            >
              <svg
                className={`w-8 h-8 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>

            {/* Sign Out Button */}
            <motion.button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('class_info');
                navigate('/sign-in');
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-red-600 hover:bg-red-500' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white transition-colors duration-300`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Out
            </motion.button>
          </div>
        </motion.nav>
      </div>

      {/* Main Content - Fixed container width and padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {classData ? (
          <div className="space-y-6">
            <motion.h1 
              className="text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {classData.name}
            </motion.h1>
            
            {/* New Post Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewPostForm(true)}
              className={`mb-6 px-6 py-3 rounded-lg ${
                darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-semibold shadow-lg flex items-center justify-center gap-2`}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              Create New Post
            </motion.button>
            
            {/* Posts Grid */}
            <div className="grid gap-6">
              {posts.map((post, index) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`p-6 rounded-lg shadow-lg ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                  } transition-colors duration-300`}
                >
                  <h2 className="text-xl font-semibold mb-4">{post.title}</h2>
                  <div 
                    className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    dangerouslySetInnerHTML={{ 
                      __html: post.content.replace(/\n/g, '<br>')
                    }}
                  />
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Posted by {post.author} on {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl">Loading class data...</p>
          </div>
        )}
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPostForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-lg p-6 max-w-2xl w-full shadow-xl`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Posting as {localStorage.getItem('username')}
                </span>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    className={`w-full p-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select a category</option>
                    <option value="question">Question</option>
                    <option value="discussion">Discussion</option>
                    <option value="resource">Resource</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                {/* Title Input */}
                <input
                  type="text"
                  placeholder="Give this post a title"
                  className={`w-full p-4 rounded-lg border text-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  required
                />

                {/* Content Input */}
                <div className="relative">
                  <textarea
                    value={postContent.text}
                    onChange={(e) => setPostContent(prev => ({ ...prev, text: e.target.value }))}
                    className={`w-full p-4 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px]`}
                    rows="6"
                    placeholder="Write your post here. Add photos, videos and more to get your message across."
                    required
                  />
                  
                  {/* Code Snippets Display */}
                  {postContent.codeSnippets.map((snippet, index) => (
                    <div key={snippet.id} className="mt-4 rounded-lg overflow-hidden border dark:border-gray-600">
                      <div className={`flex items-center justify-between p-2 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-mono ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {snippet.language}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setPostContent(prev => ({
                              ...prev,
                              codeSnippets: prev.codeSnippets.filter(s => s.id !== snippet.id)
                            }));
                          }}
                          className="text-gray-500 hover:text-red-500 px-2"
                        >
                          ×
                        </button>
                      </div>
                      <div className={`p-4 font-mono text-sm ${
                        darkMode ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <pre className="max-h-[250px] overflow-y-auto">
                          <code className={`language-${snippet.language || 'javascript'}`}>
                            {snippet.code.trim()}
                          </code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expandable Lists */}
                {postContent.expandableLists.map(list => (
                  <div key={list.id} className="mt-4 border rounded-lg overflow-hidden">
                    <div 
                      className={`p-4 cursor-pointer flex items-center gap-2 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                      onClick={() => updateExpandableList(list.id, 'isCollapsed', !list.isCollapsed)}
                    >
                      <span className="transform transition-transform duration-200" style={{
                        transform: list.isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                      }}>
                        ▼
                      </span>
                      <input
                        type="text"
                        value={list.title}
                        onChange={(e) => updateExpandableList(list.id, 'title', e.target.value)}
                        className={`flex-1 bg-transparent border-none focus:ring-0 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}
                        placeholder="Write a title"
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPostContent(prev => ({
                            ...prev,
                            expandableLists: prev.expandableLists.filter(item => item.id !== list.id)
                          }));
                        }}
                        className="text-gray-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                    {!list.isCollapsed && (
                      <div className="p-4">
                        <textarea
                          value={list.content}
                          onChange={(e) => updateExpandableList(list.id, 'content', e.target.value)}
                          className={`w-full p-2 rounded border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                          placeholder="Add content to expand"
                          rows="3"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Media Buttons */}
                <div className="flex gap-2">
                  {/* Image Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>

                  {/* Video Upload */}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </label>

                  {/* File Upload */}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </label>

                  {/* Divider */}
                  <button type="button" onClick={insertDivider} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16M4 6h16M4 18h16" />
                    </svg>
                  </button>

                  {/* Emoji */}
                  <div className="relative">
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                  </div>

                  {/* GIF */}
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowGifPicker(!showGifPicker)} 
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-medium"
                    >
                      GIF
                    </button>
                    {showGifPicker && (
                      <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl" style={{ width: '320px' }}>
                        <input
                          type="text"
                          value={gifSearchTerm}
                          onChange={(e) => {
                            setGifSearchTerm(e.target.value);
                            if (e.target.value) {
                              searchGifs(e.target.value);
                            }
                          }}
                          placeholder="Search GIFs..."
                          className={`w-full p-2 mb-2 rounded border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                        <div className="max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-2 gap-2">
                            {gifs.map((gif) => (
                              <div 
                                key={gif.id} 
                                className="cursor-pointer hover:opacity-80"
                                onClick={() => handleGifSelect(gif)}
                              >
                                <img
                                  src={gif.images.fixed_height_small.url}
                                  alt="GIF"
                                  className="rounded w-full h-auto"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expandable List */}
                  <button type="button" onClick={insertExpandableList} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </button>

                  {/* Poll */}
                  <button type="button" onClick={() => setShowPollForm(!showPollForm)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>

                  {/* Code Snippet */}
                  <button 
                    type="button" 
                    onClick={() => setShowCodeEditor(true)} 
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>
                </div>

                {/* Poll Form */}
                {showPollForm && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Create Poll</h3>
                    {pollOptions.map((option, index) => (
                      <input
                        key={index}
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="mb-2 w-full p-2 rounded border"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-blue-500 hover:text-blue-600 mt-2"
                    >
                      + Add Option
                    </button>
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={handlePollSubmit}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Add Poll
                      </button>
                    </div>
                  </div>
                )}

                {/* Code Editor */}
                {showCodeEditor && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className={`${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    } rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[80vh] flex flex-col`}>
                      <div className="flex-shrink-0">
                        <h3 className={`text-lg font-medium mb-4 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Add Code Snippet
                        </h3>
                        
                        <select
                          value={codeLanguage}
                          onChange={(e) => setCodeLanguage(e.target.value)}
                          className={`w-full p-2 mb-4 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                          <option value="csharp">C#</option>
                          <option value="html">HTML</option>
                          <option value="css">CSS</option>
                          <option value="sql">SQL</option>
                        </select>
                      </div>

                      <div className="flex-1 min-h-0 mb-4">
                        <textarea
                          value={codeContent}
                          onChange={(e) => setCodeContent(e.target.value)}
                          placeholder="Paste your code here..."
                          className={`w-full h-full p-4 rounded-lg border font-mono ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          } resize-none overflow-auto`}
                          style={{ minHeight: "150px", maxHeight: "calc(60vh - 200px)" }}
                        />
                      </div>

                      <div className="flex-shrink-0 flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCodeEditor(false);
                            setCodeContent('');
                          }}
                          className={`px-4 py-2 rounded-lg ${
                            darkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleCodeSubmit();
                            setShowCodeEditor(false);
                          }}
                          className={`px-4 py-2 rounded-lg text-white ${
                            darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          Insert Code
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowNewPostForm(false)}
                    className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className={`px-6 py-2 rounded-lg text-white ${
                      darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Publish
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassFeed; 