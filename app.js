const express = require("express");
const path = require("path");

const app = express();

// Serve static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "public")));

// Serve HTML files from the "views" directory
app.use(express.static(path.join(__dirname, "views")));

// Route to serve the homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Route for login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
