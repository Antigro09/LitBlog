import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Loader from './components/Loader';

const PostView = () => {
  const { classId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/api/classes/${classId}/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPost(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load post');
        setLoading(false);
      }
    };

    fetchPost();
  }, [classId, postId]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
        >
          {/* Back Button */}
          <div className="p-4 border-b dark:border-gray-700">
            <button
              onClick={() => navigate(`/class-feed/${classId}`)}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Class
            </button>
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
              <p className="text-gray-600 dark:text-gray-300">{post.content}</p>
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