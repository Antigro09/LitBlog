import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

const ClassDetails = ({ classData, darkMode, onBack }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classDetails, setClassDetails] = useState(classData);
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
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.detail || 'Failed to load class details');
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [classData.id]);

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
                            <p className="text-2xl font-bold">{classDetails.students?.length || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Posts</p>
                            <p className="text-2xl font-bold">{classDetails.total_posts || 0}</p>
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
                {classDetails.students?.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-lg backdrop-blur-md bg-white/50 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-semibold">{student.name}</h4>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Posts: {student.posts_count}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'Blogs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-4"
              >
                {classDetails.posts?.length > 0 ? (
                  classDetails.posts.map((post) => (
                    <motion.div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => navigate(`/class/${classData.id}/post/${post.id}`)}
                    >
                      <div className="p-6">
                        {/* Author Info */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            {post.author[0]}
                          </div>
                          <div>
                            <h3 className="font-medium dark:text-white">
                              {post.author}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Post Title and Preview */}
                        <h2 className="text-xl font-semibold mb-2 dark:text-white">{post.title}</h2>
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-3">{post.content}</p>

                        {/* Post Stats */}
                        <div className="mt-4 flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <span>👍</span>
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>💬</span>
                            <span>{post.comments}</span>
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
                  {/* Add chart or graph here */}
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