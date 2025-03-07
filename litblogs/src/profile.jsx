import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const profile = ({ darkMode }) => {
  const [name, setName] = useState("User Name");
  const [bio, setBio] = useState("This is your bio. Edit to add more details.");
  const [image, setImage] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <div className="flex flex-col items-center">
        <label htmlFor="imageUpload" className="cursor-pointer">
          {image ? (
            <img src={image} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gray-300 text-gray-600">
              Upload Image
            </div>
          )}
        </label>
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
      <div className="mt-4 text-center">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xl font-bold text-center bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-2 w-full text-center bg-transparent border border-gray-400 p-2 rounded focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default profile;
