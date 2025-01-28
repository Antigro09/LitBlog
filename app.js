const express = require('express');
const path = require('path');
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory (optional if you have a custom folder structure)
app.set('views', path.join(__dirname, 'views'));

// Serve static files like CSS, images, etc.
app.use(express.static(path.join(__dirname, 'public')));

// Sample route to render the EJS page
app.get('/', (req, res) => {
    res.render('index', { title: 'LitBlogs', message: 'Testing sigma' });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
