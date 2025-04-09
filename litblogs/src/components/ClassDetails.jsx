import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';
import ReactHtmlParser from 'react-html-parser';

const ClassDetails = ({ classData, darkMode, onBack }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classDetails, setClassDetails] = useState(classData);
  const [students, setStudents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const navigate = useNavigate();

  const tabs = ['Overview', 'Students', 'Blogs', 'Analytics'];

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:8000/api/classes/${classData.id}/details`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setClassDetails(response.data);
        setStudentCount(response.data.enrollment_count || 0);
        setLoading(false);
        
        // Fetch students enrolled in the class
        const enrollmentResponse = await axios.get(
          `http://localhost:8000/api/classes/${classData.id}/students`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setStudents(enrollmentResponse.data);
        
        // Fetch posts for this class
        const postsResponse = await axios.get(
          `http://localhost:8000/api/classes/${classData.id}/posts`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setPosts(postsResponse.data);
        setPostCount(postsResponse.data.length);
        
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to load class details');
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [classData.id]);
  
  // Function to truncate HTML content for preview
  const truncateHTML = (htmlContent, maxLength = 100) => {
    if (!htmlContent) return '';
    
    // Create a div to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get text content
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Truncate text content
    if (textContent.length <= maxLength) {
      return htmlContent;
    }
    
    return textContent.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-8">
        <motion.button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
          whileHover={{ x: -5 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Classes
        </motion.button>
      </div>

      {/* Class Title and Code */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{classData.name}</h2>
        <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-500">
          Code: {classDetails.access_code}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 -mb-px ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'Overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Class Description */}
                <div className="p-6 rounded-lg backdrop-blur-md bg-white/50 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10">
                  <h3 className="text-xl font-semibold mb-4">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300">{classDetails.description}</p>
                </div>

                {/* Quick Stats */}
                <div className="p-6 rounded-lg backdrop-blur-md bg-white/50 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10">
                    <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Total Students</p>
                            <p className="text-2xl font-bold">{studentCount}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Posts</p>
                            <p className="text-2xl font-bold">{postCount}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Today</p>
                            <p className="text-2xl font-bold">85%</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Avg. Engagement</p>
                            <p className="text-2xl font-bold">92%</p>
                        </div>
                    </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Students' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4"
              >
                <h3 className="text-xl font-semibold mb-4">Students ({studentCount})</h3>
                
                {students.length > 0 ? (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 rounded-lg backdrop-blur-md bg-white/50 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                            {student.first_name?.[0] || student.username?.[0] || '?'}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold">{student.first_name} {student.last_name}</h4>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Posts: {student.posts_count || 0}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    No students enrolled yet
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'Blogs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4"
              >
                <h3 className="text-xl font-semibold mb-4">Posts ({postCount})</h3>
                
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <motion.div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => navigate(`/class/${classData.id}/post/${post.id}`)}
                    >
                      <div className="p-6">
                        {/* Author Info */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                              {post.author_name?.[0] || '?'}
                            </div>
                            <div className="ml-2">
                              <h3 className="text-sm font-medium dark:text-white">
                                {post.author_name || 'Unknown'}
                              </h3>
                            </div>
                          </div>
                          
                          {/* Move the timestamp here */}
                          <span className="text-xs text-gray-500 dark:text-gray-400" data-timestamp={post.created_at}>
                            {formatRelativeTime(post.created_at)}
                          </span>
                        </div>

                        {/* Post Title and Preview */}
                        <h2 className="text-xl font-semibold mb-2 dark:text-white">{post.title}</h2>
                        <div className="text-gray-600 dark:text-gray-300 line-clamp-3">
                          {ReactHtmlParser(truncateHTML(post.content, 150))}
                        </div>

                        {/* Post Stats */}
                        <div className="mt-4 flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{post.likes || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post.comments || 0}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No posts yet
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'Analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Add analytics content here */}
                <div className="p-6 rounded-lg backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10">
                  <h3 className="text-xl font-semibold mb-4">Engagement Over Time</h3>
                  <div className="text-center py-12 text-gray-500">
                    Analytics data coming soon
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassDetails; 