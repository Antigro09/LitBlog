import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./LitBlogs.css";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // Handle Google login response
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:8000/api/auth/google-login", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("token", res.data.access_token);
      const userInfo = {
        role: res.data.role,
        userId: res.data.user_id,
        username: res.data.username,
        email: res.data.email,
      };
      localStorage.setItem("user_info", JSON.stringify(userInfo));

      // Redirect based on user role
      if (res.data.role === "STUDENT") {
        navigate("/student-hub");
      } else if (res.data.role === "TEACHER") {
        navigate("/teacher-dashboard");
      } else if (res.data.role === "ADMIN") {
        navigate("/admin-dashboard");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setErrorMessage("Google login failed");
    }
  };

  // Existing email/password login flow
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await axios.post("http://localhost:8000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.access_token);
      const userInfo = {
        role: response.data.role,
        userId: response.data.user_id,
        username: response.data.username,
        email: response.data.email,
      };
      localStorage.setItem("user_info", JSON.stringify(userInfo));

      // Redirect based on user role
      if (response.data.role === "STUDENT") {
        navigate("/student-hub");
      } else if (response.data.role === "TEACHER") {
        navigate("/teacher-dashboard");
      } else if (response.data.role === "ADMIN") {
        navigate("/admin-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.response?.data?.detail || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId="653922429771-qdjgvs7vkrcd7g4o2oea12t097ah4eog.apps.googleusercontent.com">
      <div className="min-h-screen flex items-center justify-center transition-all duration-500">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-4xl font-semibold text-center mb-6">Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
              <input id="email" type="email" className="w-full p-4 border rounded-lg" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <input id="password" type="password" className="w-full p-4 border rounded-lg" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {errorMessage && <p className="text-red-500 text-sm text-center mb-4">{errorMessage}</p>}
            <button type="submit" className="w-full p-4 text-white rounded-lg text-lg bg-blue-600 hover:bg-blue-700">
              Sign In
            </button>
          </form>

          {/* Google Login */}
          <div className="mt-6">
            <p className="text-center text-sm mb-4">Or sign in with:</p>
            <GoogleLogin onSuccess={handleGoogleLogin} onError={() => setErrorMessage("Google login failed")} />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default SignInPage;
