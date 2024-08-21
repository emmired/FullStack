const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post')
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require("path")
const authenticate = require('../middleware/authenticate');

// Use the generated secret key
const JWT_SECRET = '9878924f604a926a44cacd21fd5e9b8061c2beae286f570902d16b0229f224f9fcf4e3d046e682e614c6971327b49409626de20248677f6fcbaaba3ef063147a'; // Replace with your actual generated secret key

// Register a new user
router.post('/signup', async (req, res) => {
    console.log(req.body);
    const { firstName, lastName, otherName, displayName, email, password, age } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const user = new User({ firstName, lastName, otherName, displayName, email, password, age });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Send the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.redirect('/')
    
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return res.status(400).send({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Send the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
        res.redirect('/');

    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
});

// Get user profile
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'firstName lastName displayName') // Populating followers with specific fields
            .populate('following', 'firstName lastName displayName') // Populating following with specific fields
            .populate({
                path: 'posts',
                populate: {
                    path: 'user', // Populate the user field in posts if needed
                    select: 'firstName lastName displayName' // Adjust fields as needed
                }
            });

        if (!user) {
            return res.status(404).send({ success: false, message: 'User not found' });
        }

        res.render('profile', { user });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});


// Get all users
router.get('/users', authenticate, async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send({
            success: true,
            users: users,
            request: {
                query: req.query,
                params: req.params,
                headers: req.headers,
                body: req.body
            }
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            error: err.message,
            request: {
                query: req.query,
                params: req.params,
                headers: req.headers,
                body: req.body
            }
        });
    }
});

// Get a user by ID
router.get('/users/:id', authenticate, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).send({
            success: false,
            error: 'Invalid ID format',
            request: req.params
        });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({
                success: false,
                error: 'User not found',
                request: req.params
            });
        }
        res.status(200).send({
            success: true,
            user: user,
            request: req.params
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            error: err.message,
            request: req.params
        });
    }
});

// Update a user by ID
router.put('/users/:id', authenticate, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).send({
                success: false,
                error: 'User not found',
                request: req.params
            });
        }
        res.status(200).send({
            success: true,
            user: user,
            request: req.body // Include request body in the response
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            error: err.message,
            request: req.body // Include request body in the response even on error
        });
    }
})

// Follow a User
router.put('/follow/:id', authenticate, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id)

        if (!userToFollow) {
            return res.status(404).send({ success: false, message: 'User not found' })
        }

        const currentUser = await User.findById(req.user.id)

        if (currentUser.id == req.params.id) {
            return res.status(400).send({ success: false, message: "You can't follow yourself" })
        }

        if (currentUser.following.includes(req.params.id)) {
            return res.status(400).send({ success: false, message: 'Already following this user'})
        }

        currentUser.following.push(req.params.id)
        userToFollow.followers.push(req.user.id)

        await currentUser.save()
        await userToFollow.save()

        res.status(200).send({
            success: true,
            message: 'User followed successfully'
        })
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        })
    }
})

// Unfollow a user
router.put('/unfollow/:id', authenticate, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id)
        if (!userToUnfollow) {
            return res.status(400).send({ success: false, message: 'User not found' })                        
        }

        const currentUser = await User.findById(req.user.id)

        if (!currentUser.following.includes(req.params.id)) {
            return res.status(400).send({ success: false, message: 'Not following this user' })            
        }

        currentUser.following = currentUser.following.filter(userId => userId.toString() !== req.params.id)
        userToUnfollow.followers = userToUnfollow.followers.filter(userId => userId.toString() !== req.user.id)

        await currentUser.save()
        await userToUnfollow.save()

        res.status(200).send({ success: true, message: 'User unfollowed successfully' })
    } catch (err) {
        res.status(500).send({ success: false, message: err.message })        
    }
})

// Display JWT Token for testing purpose
router.get('/token', (req, res) => {
    const crypto = require('crypto');

    // Generate a random secret key
    const secretKey = crypto.randomBytes(64).toString('hex');
    
    console.log('Generated JWT Secret Key:', secretKey);
    

    if (!secretKey) {
        return res.status(404).send({
            success: false,
            message: 'No token found'
        });
    }

    res.status(200).send({
        success: true,
        secretKey
    });
});

// Example of a protected route
router.get('/protected', authenticate, (req, res) => {
    res.render('index')
});

module.exports = router;
