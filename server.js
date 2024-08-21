const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const userRoutes = require('./routes/users')
const postRoutes = require('./routes/posts')
const path = require("path")
const Post = require('./models/Post')
const authenticate = require("./middleware/authenticate")

const app = express()
const port = 3001

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Set EJS as the view engine
app.set('view engine', 'ejs')


// MongoDB Connection
const dbURI = 'mongodb://localhost:27017/users';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Render signup page
app.get('/signup', (req, res) => {
    res.render('signup')
})

// Render login page
app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(200)
    res.redirect('/login') 
});

app.get('/test-image', (req, res) => {
    res.render('test-image'); // Renders the test-image.ejs template
});

app.get('/', authenticate, async (req, res) => {

    try {
        const posts = await Post.find()
            .populate('user', 'firstName lastName displayName') // Populating the user field in posts
            .populate('comments.user', 'firstName lastName displayName') // Populating the user field in comments
            .populate('likes', 'firstName lastName displayName') // Populating the user field in likes
  
        res.render('index', { posts, userId: req.userId });
        
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
