import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const [name, setName] = useState("User Name");
  const [bio, setBio] = useState("This is your bio. Edit to add more details.");
  const [image, setImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-darkblue pb-12">
      <Navbar />
      
      <main className="pt-16">
        {/* Cover Image */}
        <div className="h-64 overflow-hidden relative rounded-b-lg animate-fade-in">
          <img
            src="https://images.unsplash.com/photo-1560355206-7bdbaa28ea62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80"
            alt="Cover"
            className="w-full object-cover h-full transition-transform duration-700 hover:scale-105"
          />
          <button 
            className="absolute bottom-4 right-4 rounded-full bg-black/30 hover:bg-black/50 p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
              <circle cx="12" cy="13" r="3"></circle>
            </svg>
          </button>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row sm:items-end -mt-20 sm:-mt-16 mb-6 gap-4">
            <div className="relative">
              <label htmlFor="imageUpload" className="cursor-pointer">
                <div className="h-36 w-36 rounded-full overflow-hidden ring-4 ring-darkblue border-2 border-blue-400/50 flex items-center justify-center bg-blue-400/20">
                  {image ? (
                    <img src={image} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                </div>
                <button 
                  className="absolute bottom-1 right-1 rounded-full bg-black/30 hover:bg-black/50 h-8 w-8 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </svg>
                </button>
              </label>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row flex-grow justify-between items-start sm:items-end gap-4 sm:pb-2">
              {isEditing ? (
                <div className="mt-4 sm:mt-0">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold bg-darkblue-light/50 text-white border-b border-blue-400 focus:outline-none focus:border-blue-300 px-2 py-1 w-full"
                    placeholder="Your Name"
                  />
                </div>
              ) : (
                <div className="mt-4 sm:mt-0">
                  <h1 className="text-2xl font-bold text-white">{name}</h1>
                  <p className="text-gray-400">@{name.toLowerCase().replace(/\s+/g, '')}</p>
                </div>
              )}
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  className="flex-1 sm:flex-initial bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                  {isEditing ? "Save Profile" : "Edit Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="mb-6 flex justify-around sm:justify-start sm:space-x-10 text-center sm:text-left">
            <div>
              <span className="block text-2xl font-bold text-white">0</span>
              <span className="text-gray-400">Posts</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">0</span>
              <span className="text-gray-400">Followers</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">0</span>
              <span className="text-gray-400">Following</span>
            </div>
          </div>
        </div>
        
        {/* Bio Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm glass-card overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About Me</h2>
              
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-32 bg-darkblue-light/50 text-gray-300 border border-blue-400/30 p-3 rounded focus:outline-none focus:border-blue-400 resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-300 mb-6">{bio}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Empty Posts Section */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="glass-card p-8 text-center rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">No Posts Yet</h2>
            <p className="text-gray-400 mb-6">Share your first literary creation with the community!</p>
            <Link to="/">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Create Your First Post
              </button>
            </Link>
          </div>
        </div>
        
        {/* Floating Action Button for Creating Post */}
        <div className="fixed bottom-8 right-8">
          <button 
            className="rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
