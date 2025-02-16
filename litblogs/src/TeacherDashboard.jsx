import { useState, useEffect } from 'react';

// Mock database using localStorage
const mockDB = {
  classes: JSON.parse(localStorage.getItem('classes')) || [],
  students: JSON.parse(localStorage.getItem('students')) || [],
  blogs: JSON.parse(localStorage.getItem('blogs')) || [],
  analytics: JSON.parse(localStorage.getItem('analytics')) || {
    totalBlogs: 0,
    approvedBlogs: 0,
    flaggedBlogs: 0,
    studentActivity: {}
  }
};

const TeacherDashboard = () => {
  // State Management
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showClassForm, setShowClassForm] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '', joinCode: '' });
  const [selectedBlogs, setSelectedBlogs] = useState([]);
  
  // Data States
  const [classes, setClasses] = useState(mockDB.classes);
  const [students, setStudents] = useState(mockDB.students);
  const [blogs, setBlogs] = useState(mockDB.blogs);
  const [analytics, setAnalytics] = useState(mockDB.analytics);

  // Persist data to localStorage
  useEffect(() => {
    localStorage.setItem('classes', JSON.stringify(classes));
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('blogs', JSON.stringify(blogs));
    localStorage.setItem('analytics', JSON.stringify(analytics));
  }, [classes, students, blogs, analytics]);

  // Dark Mode Toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Class Creation
  const createClass = () => {
    if (!newClass.name || !newClass.joinCode) {
      alert('Please fill all required fields');
      return;
    }
    
    if (classes.some(c => c.joinCode === newClass.joinCode)) {
      alert('Join code must be unique!');
      return;
    }

    setClasses([...classes, { ...newClass, students: [] }]);
    setShowClassForm(false);
    setNewClass({ name: '', description: '', joinCode: '' });
  };

  // Blog Management
  const updateBlogStatus = (id, status) => {
    const updatedBlogs = blogs.map(blog => 
      blog.id === id ? { ...blog, status, flagged: status === 'Rejected' } : blog
    );
    setBlogs(updatedBlogs);
    updateAnalytics(updatedBlogs);
  };

  const bulkUpdateBlogs = (status) => {
    const updatedBlogs = blogs.map(blog => 
      selectedBlogs.includes(blog.id) ? { ...blog, status, flagged: status === 'Rejected' } : blog
    );
    setBlogs(updatedBlogs);
    setSelectedBlogs([]);
    updateAnalytics(updatedBlogs);
  };

  // Analytics Updates
  const updateAnalytics = (blogs) => {
    const newAnalytics = {
      totalBlogs: blogs.length,
      approvedBlogs: blogs.filter(b => b.status === 'Approved').length,
      flaggedBlogs: blogs.filter(b => b.flagged).length,
      studentActivity: students.reduce((acc, student) => ({
        ...acc,
        [student.id]: blogs.filter(b => b.authorId === student.id).length
      }), {})
    };
    setAnalytics(newAnalytics);
  };

  // Student Management
  const addStudent = (student) => {
    const newStudent = { ...student, id: students.length + 1 };
    setStudents(prev => [...prev, newStudent]);
    
    setClasses(prevClasses => 
      prevClasses.map(c => 
        c.joinCode === student.joinCode 
          ? { ...c, students: [...c.students, newStudent.id] }
          : c
      )
    );
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      {/* Sidebar */}
      <div className={`w-64 p-4 fixed h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h2 className="text-xl font-bold mb-8">Teacher Portal</h2>
        {['Dashboard', 'Manage Blogs', 'Manage Students', 'Analytics', 'Settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left p-3 mb-2 rounded-lg transition-all ${
              activeTab === tab ? (darkMode ? 'bg-teal-600' : 'bg-blue-600 text-white') : 
              'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{activeTab}</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {darkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>

        {activeTab === 'Dashboard' && (
          <Dashboard 
            darkMode={darkMode}
            classes={classes}
            blogs={blogs}
            showClassForm={showClassForm}
            setShowClassForm={setShowClassForm}
            newClass={newClass}
            setNewClass={setNewClass}
            createClass={createClass}
          />
        )}

        {activeTab === 'Manage Blogs' && (
          <BlogManagement
            darkMode={darkMode}
            blogs={blogs}
            selectedBlogs={selectedBlogs}
            setSelectedBlogs={setSelectedBlogs}
            updateBlogStatus={updateBlogStatus}
            bulkUpdateBlogs={bulkUpdateBlogs}
          />
        )}

        {activeTab === 'Manage Students' && (
          <StudentManagement
            darkMode={darkMode}
            students={students}
            classes={classes}
            addStudent={addStudent}
          />
        )}

        {activeTab === 'Analytics' && <Analytics darkMode={darkMode} analytics={analytics} students={students} />}
        
        {activeTab === 'Settings' && <Settings darkMode={darkMode} setDarkMode={setDarkMode} />}
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ darkMode, classes, blogs, showClassForm, setShowClassForm, newClass, setNewClass, createClass }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Classes" value={classes.length} color="bg-purple-500" />
      <StatCard title="Students" value={classes.reduce((acc, c) => acc + c.students.length, 0)} color="bg-green-500" />
      <StatCard title="Pending Blogs" value={blogs.filter(b => b.status === 'Pending').length} color="bg-yellow-500" />
      <StatCard title="Flagged Content" value={blogs.filter(b => b.flagged).length} color="bg-red-500" />
    </div>

    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">Classes</h2>
      <button
        onClick={() => setShowClassForm(true)}
        className={`px-4 py-2 rounded ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
      >
        Create New Class
      </button>
    </div>

    {showClassForm && (
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow animate-fadeIn`}>
        <h3 className="text-lg font-bold mb-4">Create New Class</h3>
        <input
          type="text"
          placeholder="Class Name *"
          value={newClass.name}
          onChange={(e) => setNewClass({...newClass, name: e.target.value})}
          className={`w-full p-2 mb-4 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
        />
        <input
          type="text"
          placeholder="Join Code *"
          value={newClass.joinCode}
          onChange={(e) => setNewClass({...newClass, joinCode: e.target.value})}
          className={`w-full p-2 mb-4 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
        />
        <textarea
          placeholder="Description"
          value={newClass.description}
          onChange={(e) => setNewClass({...newClass, description: e.target.value})}
          className={`w-full p-2 mb-4 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowClassForm(false)}
            className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={createClass}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            Create
          </button>
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {classes.map((classObj) => (
        <div key={classObj.joinCode} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="text-lg font-bold">{classObj.name}</h3>
          <p className="text-gray-500">{classObj.description}</p>
          <div className="mt-2">
            <span className="text-sm">Join Code: {classObj.joinCode}</span>
            <span className="ml-4 text-sm">Students: {classObj.students.length}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Blog Management Component
const BlogManagement = ({ darkMode, blogs, selectedBlogs, setSelectedBlogs, updateBlogStatus, bulkUpdateBlogs }) => {
  const toggleSelect = (id) => {
    setSelectedBlogs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Blog Management</h2>
        <div className="space-x-2">
          <button 
            onClick={() => bulkUpdateBlogs('Approved')} 
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Approve Selected
          </button>
          <button 
            onClick={() => bulkUpdateBlogs('Rejected')} 
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Reject Selected
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <tr>
              <th className="p-3 text-left">Select</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Author</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map(blog => (
              <tr key={blog.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedBlogs.includes(blog.id)}
                    onChange={() => toggleSelect(blog.id)}
                  />
                </td>
                <td className="p-3">{blog.title}</td>
                <td className="p-3">{blog.author}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded ${
                    blog.status === 'Pending' ? 'bg-yellow-500' :
                    blog.status === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}>
                    {blog.status}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  <button 
                    onClick={() => updateBlogStatus(blog.id, 'Approved')}
                    className="text-green-500 hover:text-green-700"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => updateBlogStatus(blog.id, 'Rejected')}
                    className="text-red-500 hover:text-red-700"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Analytics Component
const Analytics = ({ darkMode, analytics, students }) => {
  const maxBlogs = Math.max(analytics.totalBlogs, 1);
  const maxActivity = Math.max(...Object.values(analytics.studentActivity), 1);

  return (
    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <h2 className="text-xl font-bold mb-6">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Blogs Overview */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-bold mb-4">Blog Statistics</h3>
          <div className="space-y-4">
            <BarChart 
              label="Total Blogs" 
              value={analytics.totalBlogs} 
              max={maxBlogs} 
              darkMode={darkMode} 
            />
            <BarChart 
              label="Approved Blogs" 
              value={analytics.approvedBlogs} 
              max={maxBlogs} 
              color="bg-green-500" 
              darkMode={darkMode} 
            />
            <BarChart 
              label="Flagged Blogs" 
              value={analytics.flaggedBlogs} 
              max={maxBlogs} 
              color="bg-red-500" 
              darkMode={darkMode} 
            />
          </div>
        </div>

        {/* Student Activity */}
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h3 className="text-lg font-bold mb-4">Student Activity</h3>
          <div className="space-y-4">
            {students.map(student => (
              <div key={student.id} className="flex items-center">
                <span className="w-32 truncate">{student.name}:</span>
                <div className="flex-1 ml-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${(analytics.studentActivity[student.id] || 0 / maxActivity) * 100}%` }}
                  />
                </div>
                <span className="ml-4 w-12">{analytics.studentActivity[student.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Management Component
const StudentManagement = ({ darkMode, students, classes, addStudent }) => {
  const [newStudent, setNewStudent] = useState({ name: '', joinCode: '' });

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.joinCode) {
      alert('Please fill all required fields');
      return;
    }
    
    if (!classes.some(c => c.joinCode === newStudent.joinCode)) {
      alert('Invalid join code!');
      return;
    }

    addStudent(newStudent);
    setNewStudent({ name: '', joinCode: '' });
  };

  return (
    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <h2 className="text-xl font-bold mb-6">Student Management</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Add New Student</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Student Name *"
            value={newStudent.name}
            onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
            className={`flex-1 p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
          />
          <input
            type="text"
            placeholder="Class Join Code *"
            value={newStudent.joinCode}
            onChange={(e) => setNewStudent({...newStudent, joinCode: e.target.value})}
            className={`flex-1 p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
          />
          <button
            onClick={handleAddStudent}
            className={`px-4 py-2 rounded ${darkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            Add Student
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <tr>
              <th className="p-3 text-left">Student Name</th>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-left">Join Code</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-3">{student.name}</td>
                <td className="p-3">
                  {classes.find(c => c.joinCode === student.joinCode)?.name || 'Not Enrolled'}
                </td>
                <td className="p-3">{student.joinCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, color }) => (
  <div className={`p-4 rounded-lg ${color} text-white shadow`}>
    <h3 className="text-lg font-bold">{title}</h3>
    <p className="text-3xl">{value}</p>
  </div>
);

const BarChart = ({ label, value, max, color = 'bg-blue-500', darkMode }) => {
  const widthPercentage = (value / max) * 100 || 0;
  return (
    <div className="flex items-center">
      <span className="w-32">{label}</span>
      <div className="flex-1 ml-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
      <span className="ml-4 w-12">{value}</span>
    </div>
  );
};

// Settings Component
const SettingsContent = ({ darkMode, settings, setSettings }) => (
  <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
    <h2 className="text-xl font-bold mb-6">Settings</h2>
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
            className="form-checkbox"
          />
          <span>Email Notifications</span>
        </label>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.plagiarismCheck}
            onChange={(e) => setSettings({ ...settings, plagiarismCheck: e.target.checked })}
            className="form-checkbox"
          />
          <span>Automatic Plagiarism Check</span>
        </label>
      </div>
    </div>
  </div>
);

export default TeacherDashboard;