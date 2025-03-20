import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
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
import Loader from './components/Loader';
import Navbar from "./components/Navbar";
import { Editor } from '@tinymce/tinymce-react';
import './LitBlogs.css';
import { toast } from 'react-hot-toast';
import { IoMdHeart, IoMdHeartEmpty } from 'react-icons/io';
import CommentThread from './components/CommentThread';

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
    background: #2d2d2d;
  }

  .code-header {
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  .code-snippet pre {
    margin: 0;
    padding: 1rem;
  }

  .code-snippet code {
    font-family: 'Fira Code', monospace;
    font-size: 0.9em;
  }
`;

const glassStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .glass-card:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .dark .glass-card {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .dark .glass-card:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .animate-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite linear;
  }
`;

const richTextStyles = `
  .prose {
    max-width: none;
  }
  
  .prose p {
    margin: 1em 0;
  }
  
  .prose h1, .prose h2, .prose h3, .prose h4 {
    margin: 1.5em 0 0.5em;
    font-weight: 600;
  }
  
  .prose ul, .prose ol {
    margin: 1em 0;
    padding-left: 1.5em;
  }
  
  .prose li {
    margin: 0.5em 0;
  }
  
  .prose blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1em;
    margin: 1em 0;
    font-style: italic;
  }
  
  .dark .prose blockquote {
    border-left-color: #4b5563;
  }
`;

// Add this after your imports
Prism.manual = true;

const MOCK_POSTS = [
  {
    id: 1,
    author: "Sritha Kankanala",
    title: "Cow Blog Post: Gene Editing",
    content: "What is gene editing exactly? In simple terms, gene editing is a technology that lets scientists make precise changes to the DNA inside living organisms. DNA is like the instruction manual for every living thing—it tells organisms how to develop and function.",
    isNew: true,
    likes: 1,
    comments: 0,
    timestamp: "1d"
  },
  // ... other mock posts
];

const MediaPreview = ({ media, files, onRemove }) => {
  return (
    <div className="space-y-4 mt-4">
      {/* GIFs and Images */}
      <div className="flex flex-wrap gap-4">
        {media.map((item, index) => (
          <div key={index} className="relative group">
            <img 
              src={item.url} 
              alt={item.alt} 
              className="h-32 w-32 object-cover rounded-lg"
            />
            <button
              onClick={() => onRemove('media', index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{file.name}</span>
              </div>
              <button
                onClick={() => onRemove('files', index)}
                className="text-red-500 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TINYMCE_CONFIG = {
  height: 400,
  min_height: 300,
  max_height: 500,
  resize: false,
  autoresize_bottom_margin: 50,
  menubar: false,
  plugins: [
    'advlist','typography','lists', 'link', 'image', 'charmap',
    'searchreplace', 'code', 'fullscreen', 'table', 'wordcount', 'fontfamily'
  ],
  toolbar: 'formatselect | forecolor backcolor blocks fontfamily fontsizeselect| bold italic underline strikethrough| alignleft aligncenter alignright | bullist numlist | removeformat',
  block_formats: 'Paragraph=p; Title=h1; Heading=h2; Subheading=h3; Small Heading=h4; Blockquote=blockquote',
  forced_root_block: 'p',
  content_style: `
    body { 
      font-family: Arial, sans-serif;
      font-size: 14px;
      margin: 1rem;
      padding-bottom: 2rem;
      max-height: 400px;
      overflow-y: auto !important;
    }
    h1 { font-size: 1.8em; font-weight: bold; margin: 0.5em 0; }
    h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
    h3 { font-size: 1.3em; font-weight: bold; margin: 0.5em 0; }
    h4 { font-size: 1.1em; font-weight: bold; margin: 0.5em 0; }
    blockquote { border-left: 3px solid #ccc; margin-left: 1em; padding-left: 1em; font-style: italic; }
    
    /* Fix dropdown spacing */
    .tox-collection__item-label {
      padding-left: 4px !important;
    }
    .tox-collection__item-icon {
      padding-right: 4px !important;
    }
    .tox-tbtn__select-label {
      margin-left: 0 !important;
    }
  `,
  statusbar: false,
  extended_valid_elements: 'span[style|class]',
  inline_styles: true,
  paste_as_text: false,
  paste_retain_style_properties: 'color,background-color,font-size',
  browser_spellcheck: true,
  font_formats: 'Arial=arial,helvetica,sans-serif;' + 
                'Times New Roman=times new roman,times,serif;' +
                'Courier New=courier new,courier,monospace;' +
                'Georgia=georgia,serif;' +
                'Tahoma=tahoma,arial,helvetica,sans-serif;' +
                'Trebuchet MS=trebuchet ms,geneva,sans-serif;' +
                'Verdana=verdana,geneva,sans-serif',
};

// Add this function near the top of the file, outside the component
const processHTMLWithDOM = (html) => {
  // Create a temporary div to parse the HTML
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  
  // Process all elements with font-family styles
  const elementsWithFontFamily = tempContainer.querySelectorAll('[style*="font-family"]');
  
  elementsWithFontFamily.forEach(el => {
    // Get the original style
    const style = el.getAttribute('style');
    
    // Extract font-family value
    const fontMatch = style.match(/font-family:\s*([^;]+)/i);
    if (fontMatch && fontMatch[1]) {
      const fontFamily = fontMatch[1].trim();
      
      // Apply direct inline style with important
      el.style.setProperty('font-family', fontFamily, 'important');
      
      // Add a data attribute for CSS targeting
      el.setAttribute('data-font-family', fontFamily);
      el.classList.add('custom-font');
    }
  });
  
  // Process color styles without overriding display properties
  const elementsWithColor = tempContainer.querySelectorAll('[style*="color"]');
  elementsWithColor.forEach(el => {
    const style = el.getAttribute('style');
    const colorMatch = style.match(/color:\s*([^;]+)/i);
    if (colorMatch && colorMatch[1]) {
      const color = colorMatch[1].trim();
      el.style.setProperty('color', color, 'important');
    }
  });
  
  // Handle background colors separately
  const elementsWithBg = tempContainer.querySelectorAll('[style*="background-color"]');
  elementsWithBg.forEach(el => {
    const style = el.getAttribute('style');
    const bgMatch = style.match(/background-color:\s*([^;]+)/i);
    if (bgMatch && bgMatch[1]) {
      const bgColor = bgMatch[1].trim();
      el.style.setProperty('background-color', bgColor, 'important');
      el.style.setProperty('color', 'inherit', 'important');
    }
  });
  
  return tempContainer.innerHTML;
};

// Add this function for truncating content
const truncateHTML = (html, maxLength = 300) => {
  // Create a temporary div to parse the HTML
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  
  // Get the text content
  let textContent = tempContainer.textContent || tempContainer.innerText;
  
  if (textContent.length <= maxLength) {
    return html;
  }
  
  // Truncate the text
  textContent = textContent.substring(0, maxLength).trim() + '...';
  
  // Create a simple paragraph with the truncated text
  return `<p>${textContent}</p><p class="text-blue-500 font-medium mt-2">Read more</p>`;
};

const ClassFeed = () => {
  // Move all useState hooks to the top
  const { classId } = useParams();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [classDetails, setClassDetails] = useState(null);
  const [posts, setPosts] = useState(MOCK_POSTS);
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
    codeSnippets: [],
    files: []
  });
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePostMenu, setActivePostMenu] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [likesLoading, setLikesLoading] = useState({});
  const [likeEffects, setLikeEffects] = useState({});
  const [postCommentsVisible, setPostCommentsVisible] = useState({});
  const [postComments, setPostComments] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [newCommentText, setNewCommentText] = useState({});
  const [commentCounts, setCommentCounts] = useState({});

  const gf = new GiphyFetch('FEzk8anVjSKZIiInlJWd4Jo4OuYBjV9B');

  // Move all useEffect hooks together
  useEffect(() => {
    // Load user info
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/sign-in');
          return;
        }

        // Use the correct endpoint
        const classResponse = await axios.get(`http://localhost:8000/api/classes/${classId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClassDetails(classResponse.data);

        // Get class posts using the posts endpoint
        const postsResponse = await axios.get(`http://localhost:8000/api/classes/${classId}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(postsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching class data:', error);
        setError(error.response?.data?.detail || 'Failed to load class data');
        setLoading(false);
        if (error.response?.status === 401) {
          navigate('/sign-in');
        }
      }
    };

    fetchData();
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

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = expandableListStyles + codeStyles + glassStyles + richTextStyles;
    document.head.appendChild(styleSheet);

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

  // Add the new useEffect for click outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activePostMenu && !event.target.closest('.post-menu')) {
        setActivePostMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePostMenu]);

  useEffect(() => {
    // Get likes for all posts on initial load
    const fetchLikes = async () => {
      const token = localStorage.getItem('token');
      if (!token || !posts.length) return;
      
      const likesInfo = {};
      
      for (const post of posts) {
        try {
          const response = await axios.get(`http://localhost:8000/api/classes/${classId}/posts/${post.id}/likes`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          likesInfo[post.id] = {
            count: response.data.like_count,
            userLiked: response.data.user_liked
          };
        } catch (error) {
          console.error(`Error fetching likes for post ${post.id}:`, error);
        }
      }
      
      setLikedPosts(likesInfo);
    };
    
    fetchLikes();
  }, [posts]);

  useEffect(() => {
    // Modify the existing useEffect that fetches posts
    const fetchPostsAndCounts = async () => {
      if (!classId) return;
      
      setPostsLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Fetch the posts
        const response = await axios.get(`http://localhost:8000/api/classes/${classId}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPosts(response.data);
        
        // Fetch comment counts immediately after posts load
        const counts = {};
        
        // Debug log to check if this function is running
        console.log("Fetching comment counts for posts:", response.data.length);
        
        // We'll fetch one by one to ensure reliability
        for (const post of response.data) {
          try {
            const commentResponse = await axios.get(
              `http://localhost:8000/api/classes/${classId}/posts/${post.id}/comments?limit=1`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            counts[post.id] = commentResponse.data.total;
            console.log(`Post ${post.id} has ${commentResponse.data.total} comments`);
          } catch (err) {
            console.error(`Failed to fetch comments for post ${post.id}:`, err);
            counts[post.id] = 0;
          }
        }
        
        // Log the counts before setting state
        console.log("Final comment counts:", counts);
        
        // Update comment counts
        setCommentCounts(counts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError('Failed to load posts');
      } finally {
        setPostsLoading(false);
      }
    };
    
    fetchPostsAndCounts();
  }, [classId]);

  const createPost = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Format the post content with all rich elements
      let formattedContent = postContent.text;

      // Add media (images, GIFs)
      postContent.media.forEach(media => {
        if (media.type === 'gif') {
          formattedContent += `\n[GIF:${media.url}]\n`;
        } else if (media.type === 'image') {
          formattedContent += `\n[IMAGE:${media.url}]\n`;
        }
      });

      // Add polls
      if (showPollForm && pollOptions.length > 0) {
        const validOptions = pollOptions.filter(opt => opt.trim());
        if (validOptions.length > 0) {
          formattedContent += `\n[POLL:${validOptions.join(',')}]\n`;
        }
      }

      // Add expandable lists
      postContent.expandableLists.forEach(list => {
        formattedContent += `\n[EXPANDABLE:${list.title}]${list.content}\n`;
      });

      const response = await axios.post(
        `http://localhost:8000/api/classes/${classId}/posts`,
        {
          title: postTitle,
          content: formattedContent,
          media: postContent.media,
          polls: showPollForm ? [{ options: pollOptions.filter(opt => opt.trim()) }] : [],
          files: postContent.files
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Refresh posts after creation
      const postsResponse = await axios.get(`http://localhost:8000/api/classes/${classId}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(postsResponse.data);
      
      // Reset form
      setShowNewPostForm(false);
      setPostTitle("");
      setPostContent({
        text: "",
        media: [],
        expandableLists: [],
        codeSnippets: [],
        files: []
      });
      setPollOptions(['', '']);
      setShowPollForm(false);
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
          files: [...prev.files, {
            name: file.name,
            url: response.data.url
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
      const { data } = await gf.search(term, { 
        limit: 10,
        rating: 'g', // 'g' means content suitable for children
        type: 'gifs',
        lang: 'en'
      });
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
    if (!codeContent.trim()) return;
    
    // Add code directly to the text content instead of keeping it separate
    setPostContent(prev => ({
      ...prev,
      text: prev.text + `\n[CODE:${codeLanguage}]${codeContent}\n`
    }));
    
    setShowCodeEditor(false);
    setCodeContent('');
    setCodeLanguage('javascript');
  };

  const handleRemoveMedia = (type, index) => {
    setPostContent(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Add this helper function near the top of your file
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
            </div>
            <pre>
              <code className={`language-${language}`}>
                {code}
              </code>
            </pre>
          </div>
        );
      }
      
      // ... other content type handlers ...

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <Loader />
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

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('class_info');
    setUserInfo(null);
    navigate('/');
  };

  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setContent(post.content);
    setShowNewPostForm(true);
    setActivePostMenu(null);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8000/api/classes/${classId}/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Refresh posts after deletion
        const postsResponse = await axios.get(`http://localhost:8000/api/classes/${classId}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(postsResponse.data);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
    setActivePostMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!postTitle.trim()) {
      alert("Please enter a title");
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingPostId) {
        // Editing existing post
        const response = await axios.put(
          `http://localhost:8000/api/classes/${classId}/posts/${editingPostId}`,
          {
            title: postTitle,
            content: content
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Update the post in the UI
        setPosts(posts.map(post => 
          post.id === editingPostId ? response.data : post
        ));
        
      } else {
        // Creating new post
        const response = await axios.post(
          `http://localhost:8000/api/classes/${classId}/posts`,
          {
            title: postTitle,
            content: content
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Add the new post to the UI
        setPosts([response.data, ...posts]);
      }
      
      // Reset form
      setPostTitle("");
      setContent("");
      setEditingPostId(null);
      setShowNewPostForm(false);
      
    } catch (error) {
      console.error("Error creating/updating post:", error);
      alert("Failed to create/update post. Please try again.");
    }
  };

  const handlePostAction = async (action, post) => {
    if (action === 'edit') {
      // Navigate to edit post or set edit mode
      handleEditPost(post);
    } else if (action === 'delete') {
      if (window.confirm('Are you sure you want to delete this post?')) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:8000/api/classes/${classId}/posts/${post.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Refresh posts after deletion
          const postsResponse = await axios.get(`http://localhost:8000/api/classes/${classId}/posts`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPosts(postsResponse.data);
          toast.success('Post deleted successfully');
        } catch (error) {
          console.error('Error deleting post:', error);
          toast.error('Failed to delete post');
        }
      }
    }
    // Close the menu after action
    setMenuOpen(null);
  };

  const handleLikePost = async (postId) => {
    // Prevent multiple clicks
    if (likesLoading[postId]) return;
    
    // Start loading
    setLikesLoading(prev => ({ ...prev, [postId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      
      // Optimistic update
      const isCurrentlyLiked = likedPosts[postId]?.userLiked || false;
      const currentCount = likedPosts[postId]?.count || 0;
      
      setLikedPosts(prev => ({
        ...prev,
        [postId]: {
          count: isCurrentlyLiked ? currentCount - 1 : currentCount + 1,
          userLiked: !isCurrentlyLiked
        }
      }));
      
      // Trigger heart animation
      setLikeEffects(prev => ({
        ...prev,
        [postId]: true
      }));
      
      // After animation completes
      setTimeout(() => {
        setLikeEffects(prev => ({
          ...prev,
          [postId]: false
        }));
      }, 1000);
      
      // Actually call the API
      const response = await axios.post(`http://localhost:8000/api/classes/${classId}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update with actual data from server
      setLikedPosts(prev => ({
        ...prev,
        [postId]: {
          count: response.data.like_count,
          userLiked: response.data.action === 'liked'
        }
      }));
      
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
      
      // Revert optimistic update on error
      const response = await axios.get(`http://localhost:8000/api/classes/${classId}/posts/${postId}/likes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLikedPosts(prev => ({
        ...prev,
        [postId]: {
          count: response.data.like_count,
          userLiked: response.data.user_liked
        }
      }));
    } finally {
      // End loading
      setLikesLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const loadCommentsForPost = async (postId) => {
    if (commentLoading[postId]) return;
    
    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/classes/${classId}/posts/${postId}/comments?limit=3`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPostComments(prev => ({
        ...prev,
        [postId]: response.data.comments
      }));
      
      setCommentCounts(prev => ({
        ...prev,
        [postId]: response.data.total
      }));
    } catch (error) {
      console.error(`Error loading comments for post ${postId}:`, error);
      toast.error('Failed to load comments');
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = async (postId) => {
    // If comments aren't already loaded, load them
    if (!postComments[postId]) {
      await loadCommentsForPost(postId);
    }
    
    // Toggle visibility
    setPostCommentsVisible(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleSubmitComment = async (postId, e) => {
    e.preventDefault();
    
    const commentText = newCommentText[postId];
    if (!commentText || !commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/classes/${classId}/posts/${postId}/comments`,
        { content: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update comments list with new comment
      setPostComments(prev => ({
        ...prev,
        [postId]: [response.data, ...(prev[postId] || [])]
      }));
      
      // Update comment count
      setCommentCounts(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1
      }));
      
      // Clear input
      setNewCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
      
      toast.success('Comment added');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-gray-950 text-gray-200' : 'bg-gradient-to-r from-indigo-100 to-pink-100 text-gray-900'}`}>
      {/* Navbar */}
      <Navbar
        userInfo={userInfo}
        onSignOut={handleSignOut}
        darkMode={darkMode}
        logo="/logo.png"
      />

      {/* Side Panel */}
      <div className="fixed left-0 h-full w-64 bg-gray-50/70 dark:bg-gray-800/50 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <button
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveCategory('all')}
          >
            All Posts
          </button>
          <button
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              activeCategory === 'my'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveCategory('my')}
          >
            My Posts
          </button>
        </div>
      </div>

      {/* Main Content - Add margin for side panel */}
      <div className="ml-64">
        {/* Posts Feed */}
        <div className="max-w-5xl mx-auto px-8 pt-32">
          {/* Blog Header - Moved down */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-medium">
                {classDetails?.name || 'Loading class...'}
              </h1>
              <div className="flex items-center space-x-3">
                <span>Sort by:</span>
                <select className={`rounded-lg py-2 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-300'
                  } border`}
                >
                  <option>Recent Activity</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setShowNewPostForm(false)}
                className={`px-6 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } border border-gray-300 dark:border-gray-700`}
              >
                More Actions
              </button>
              <motion.button 
                onClick={() => setShowNewPostForm(true)}
                className={`px-6 py-2 rounded-lg text-white ${
                  darkMode 
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                } transition-all duration-300 shadow-lg hover:shadow-xl`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create New Post
              </motion.button>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="space-y-8">
            {posts.map((post) => (
              <motion.div 
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-6 p-6 rounded-xl shadow-sm ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } relative`}
              >
                {/* Post Header and Details */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      {post.author?.[0] || '?'}
                    </div>
                    <div className="ml-3">
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {post.author || 'Unknown Author'}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {post.timestamp || new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Post Options Menu (3 dots) */}
                  {post.owner_id === userInfo.id && (
                    <div className="absolute top-3 right-3">
                      <button 
                        onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {menuOpen === post.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border dark:border-gray-700">
                          <div className="py-1">
                            <button
                              onClick={() => handlePostAction('edit', post)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handlePostAction('delete', post)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              
                {/* Post Title - without label */}
                <div 
                  className={`mb-4 px-4 py-3 rounded-lg border cursor-pointer ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-blue-50 border-blue-100'}`}
                  onClick={() => navigate(`/class/${classId}/post/${post.id}`)}
                >
                  <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {post.title}
                  </h4>
                </div>
              
                {/* Post Content */}
                <div 
                  className="html-content mb-4 cursor-pointer"
                  onClick={() => navigate(`/class/${classId}/post/${post.id}`)}
                  dangerouslySetInnerHTML={{ 
                    __html: truncateHTML(processHTMLWithDOM(post.content), 200) 
                  }}
                />
                
                {/* Comments Section */}
                <AnimatePresence>
                  {postCommentsVisible[post.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t dark:border-gray-700 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* New Comment Form */}
                      <form onSubmit={(e) => handleSubmitComment(post.id, e)} className="mb-4">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-sm">
                            {userInfo?.first_name?.[0] || '?'}
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={newCommentText[post.id] || ''}
                              onChange={(e) => setNewCommentText(prev => ({
                                ...prev,
                                [post.id]: e.target.value
                              }))}
                              placeholder="Add a comment..."
                              className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              rows={1}
                            />
                            <div className="flex justify-end mt-1">
                              <button
                                type="submit"
                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                              >
                                Post
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                      
                      {/* Comments List */}
                      {commentLoading[post.id] ? (
                        <div className="flex justify-center py-4">
                          <div className="w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                        </div>
                      ) : postComments[post.id]?.length > 0 ? (
                        <div className="space-y-3">
                          {postComments[post.id].map(comment => (
                            <CommentThread
                              key={comment.id}
                              comment={comment}
                              classId={classId}
                              postId={post.id}
                              token={localStorage.getItem('token')}
                              onReply={(newComment) => {
                                // Handle new reply
                                setCommentCounts(prev => ({
                                  ...prev, 
                                  [post.id]: (prev[post.id] || 0) + 1
                                }));
                              }}
                              onLike={() => {/* handle like if needed */}}
                            />
                          ))}
                          
                          {/* Show more comments link */}
                          {commentCounts[post.id] > (postComments[post.id]?.length || 0) && (
                            <div 
                              onClick={() => navigate(`/class/${classId}/post/${post.id}`)}
                              className="text-center py-2 text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                            >
                              View all {commentCounts[post.id]} comments
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Post Actions/Stats */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center space-x-6">
                    {/* Like button with animations */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikePost(post.id);
                      }}
                      className="flex items-center space-x-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors relative"
                      disabled={likesLoading[post.id]}
                    >
                      <div className="relative">
                        {likedPosts[post.id]?.userLiked ? (
                          <IoMdHeart className="w-5 h-5 text-red-500" />
                        ) : (
                          <IoMdHeartEmpty className="w-5 h-5" />
                        )}
                        
                        {/* Heart animation effect */}
                        <AnimatePresence>
                          {likeEffects[post.id] && (
                            <motion.div
                              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                              initial={{ scale: 1, opacity: 0.8 }}
                              animate={{ scale: 2, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.8 }}
                            >
                              <IoMdHeart className="w-5 h-5 text-red-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <span>{likedPosts[post.id]?.count || 0}</span>
                    </button>
                    
                    {/* Comment button (existing or new) */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComments(post.id);
                      }}
                      className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {/* Ensure we're checking if commentCounts[post.id] exists */}
                      <span>Comment{commentCounts[post.id] ? ` (${commentCounts[post.id]})` : ''}</span>
                    </button>
                  </div>
                  
                  {/* Post metadata (date/time, etc.) */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
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
              } rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto`}
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

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {/* Title Input - professional styling */}
                <div className={`mb-5 p-4 rounded-lg border ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-blue-50 border-blue-100'}`}>
                  <label htmlFor="post-title" className={`block text-base font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                    Post Title (Required)
                  </label>
                  <input
                    type="text"
                    id="post-title"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className={`w-full p-3 rounded-lg border text-lg ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-blue-200 text-gray-800'
                    }`}
                    placeholder="Enter a descriptive title for your post"
                    required
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    This will be displayed at the top of your post
                  </div>
                </div>

                {/* Content Input */}
                <div className="relative">
                  <Editor
                    apiKey="edr7zffd9q7v6okan1ka9dbc23ugp710ycjhcfroxd9undjo"
                    init={TINYMCE_CONFIG}
                    value={content}
                    onEditorChange={(content) => {
                      setContent(content);
                    }}
                  />
                  
                  {/* Add the MediaPreview component here */}
                  <MediaPreview 
                    media={postContent.media}
                    files={postContent.files}
                    onRemove={handleRemoveMedia}
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
                  {/* Image Upload/Camera */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="camera-capture"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <div className="flex gap-2">
                      {/* File Upload Button */}
                      <label htmlFor="image-upload" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer" title="Upload Image">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </label>
                      
                      {/* Camera Capture Button */}
                      <label htmlFor="camera-capture" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer" title="Take Photo">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                    </div>
                  </div>

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
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Safe Search Enabled
                          </span>
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            School Safe
                          </span>
                        </div>
                        <input
                          type="text"
                          value={gifSearchTerm}
                          onChange={(e) => {
                            setGifSearchTerm(e.target.value);
                            if (e.target.value) {
                              searchGifs(e.target.value);
                            }
                          }}
                          placeholder="Search school-appropriate GIFs..."
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
