import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import './LitBlogs.css';
import { IoMdHeart, IoMdHeartEmpty } from 'react-icons/io';
import toast from 'react-hot-toast';
import CommentThread from './components/CommentThread';

const processHTMLWithDOM = (html) => {
  // Create a temporary div to parse the HTML
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  
  // First, preserve headings by marking them
  const headings = tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    // Get the tag name to determine the heading level
    const level = heading.tagName.toLowerCase();
    heading.setAttribute('data-heading', level);
    heading.classList.add('preserved-heading');
    
    // Add size styles according to heading level
    if (level === 'h1') heading.style.fontSize = '1.8em';
    if (level === 'h2') heading.style.fontSize = '1.5em';
    if (level === 'h3') heading.style.fontSize = '1.3em';
    if (level === 'h4') heading.style.fontSize = '1.1em';
    
    heading.style.fontWeight = 'bold';
    heading.style.margin = '0.5em 0';
  });
  
  // Process all elements with font-family styles
  const elementsWithFontFamily = tempContainer.querySelectorAll('[style*="font-family"]');
  console.log("Found elements with font-family:", elementsWithFontFamily.length);
  
  elementsWithFontFamily.forEach(el => {
    // Get the original style
    const style = el.getAttribute('style');
    console.log("Original style:", style);
    
    // Extract font-family value
    const fontMatch = style.match(/font-family:\s*([^;]+)/i);
    if (fontMatch && fontMatch[1]) {
      const fontFamily = fontMatch[1].trim();
      console.log("Found font-family:", fontFamily);
      
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
      // Make sure text remains visible with highlighting
      el.style.setProperty('color', 'inherit', 'important');
    }
  });
  
  return tempContainer.innerHTML;
};

const PostView = () => {
  const { classId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showLikeEffect, setShowLikeEffect] = useState(false);
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

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

  useEffect(() => {
    if (post && post.content) {
      console.log("Post Content:", post.content);
      
      // Check for font-family styles
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = post.content;
      
      const elements = tempDiv.querySelectorAll('[style*="font-family"]');
      console.log("Elements with font-family:", elements.length);
      
      elements.forEach(el => {
        console.log("Font family style:", el.getAttribute('style'));
      });
    }
  }, [post]);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!post || !post.id) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/api/classes/${classId}/posts/${post.id}/likes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setLiked(response.data.user_liked);
        setLikeCount(response.data.like_count);
      } catch (error) {
        console.error('Error fetching like status:', error);
      }
    };
    
    fetchLikes();
  }, [post]);

  useEffect(() => {
    // Also fetch comments
    fetchComments();
  }, [postId, classId]);

  const fetchComments = async (skip = 0) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/classes/${classId}/posts/${postId}/comments?skip=${skip}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (skip === 0) {
        setComments(response.data.comments);
      } else {
        setComments([...comments, ...response.data.comments]);
      }
      
      setTotalComments(response.data.total);
      setHasMoreComments(response.data.has_more);
      setCommentsLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setCommentsLoading(false);
    }
  };

  const handleBack = () => {
    if (userInfo?.role === 'TEACHER') {
      navigate('/teacher-dashboard');
    } else {
      navigate(`/class-feed/${classId}`);
    }
  };

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    
    try {
      // Optimistic update
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      
      // Show animation effect
      setShowLikeEffect(true);
      setTimeout(() => {
        setShowLikeEffect(false);
      }, 1000);
      
      // Call API
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:8000/api/classes/${classId}/posts/${post.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update with actual data
      setLiked(response.data.action === 'liked');
      setLikeCount(response.data.like_count);
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
      
      // Revert on error
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/classes/${classId}/posts/${post.id}/likes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLiked(response.data.user_liked);
      setLikeCount(response.data.like_count);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    setCommentSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/classes/${classId}/posts/${postId}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add new comment to the list
      setComments([response.data, ...comments]);
      setTotalComments(totalComments + 1);
      
      // Clear the input
      setNewComment('');
      
      // Expand comments section if it's not already
      setCommentsExpanded(true);
      
      toast.success('Comment added');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleLoadMoreComments = () => {
    fetchComments(comments.length);
  };

  const handleCommentReply = (newReply) => {
    // No need to update state as the child component handles displaying the reply
    // Just update the total count
    setTotalComments(totalComments + 1);
  };

  const handleCommentLike = (commentId, newLikeCount, isLiked) => {
    // Update like count in state if needed for total calculations
  };

  const handleCommentButtonClick = () => {
    // Toggle comments expansion
    setCommentsExpanded(!commentsExpanded);
    
    // If comments aren't loaded yet, fetch them
    if (!comments.length && !commentsLoading) {
      fetchComments();
    }
    
    // Scroll to comments section smoothly if expanding
    if (!commentsExpanded) {
      setTimeout(() => {
        document.getElementById('comments-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
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

            {/* Post Title - without label */}
            <div className={`mb-6 px-5 py-4 rounded-lg border ${darkMode ? 'bg-gray-750 border-gray-600' : 'bg-blue-50 border-blue-100'}`}>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {post.title}
              </h1>
            </div>

            {/* Post Content */}
            <div 
              className="html-content"
              dangerouslySetInnerHTML={{ 
                __html: processHTMLWithDOM(post.content) 
              }}
            />

            {/* Interactions */}
            <div className="mt-8 pt-6 border-t dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <button 
                  onClick={handleLike}
                  className="flex items-center space-x-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  disabled={likeLoading}
                >
                  <div className="relative">
                    {liked ? (
                      <IoMdHeart className="w-6 h-6 text-red-500" />
                    ) : (
                      <IoMdHeartEmpty className="w-6 h-6" />
                    )}
                    
                    {/* Heart animation effect */}
                    <AnimatePresence>
                      {showLikeEffect && (
                        <motion.div
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                          initial={{ scale: 1, opacity: 0.8 }}
                          animate={{ scale: 2, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                        >
                          <IoMdHeart className="w-6 h-6 text-red-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
                </button>
                
                <button 
                  onClick={handleCommentButtonClick}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Comment{totalComments > 0 ? ` (${totalComments})` : ''}</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div id="comments-section" className="mt-8 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium dark:text-white">
                  Comments ({totalComments})
                </h3>
                <button
                  onClick={() => setCommentsExpanded(!commentsExpanded)}
                  className="text-sm text-blue-500 flex items-center gap-1"
                >
                  {commentsExpanded ? 'Hide comments' : 'Show comments'}
                  <svg 
                    className={`w-4 h-4 transition-transform ${commentsExpanded ? 'rotate-180' : 'rotate-0'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {/* New Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {userInfo?.first_name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={commentSubmitting}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                      >
                        {commentSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                            Posting...
                          </>
                        ) : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
              
              {/* Comments List */}
              <AnimatePresence>
                {commentsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {commentsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                      </div>
                    ) : comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map(comment => (
                          <CommentThread
                            key={comment.id}
                            comment={comment}
                            classId={classId}
                            postId={postId}
                            token={localStorage.getItem('token')}
                            onReply={handleCommentReply}
                            onLike={handleCommentLike}
                          />
                        ))}
                        
                        {/* Load More Comments */}
                        {hasMoreComments && (
                          <div className="flex justify-center my-4">
                            <button
                              onClick={handleLoadMoreComments}
                              className="px-4 py-2 text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              Load more comments
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PostView; 