const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');

// Use the generated secret key
const JWT_SECRET = '9878924f604a926a44cacd21fd5e9b8061c2beae286f570902d16b0229f224f9fcf4e3d046e682e614c6971327b49409626de20248677f6fcbaaba3ef063147a'; // Replace with your actual generated secret key

// Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password, age } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const user = new User({ name, email, password, age });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Send the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });

        res.status(201).send({
            success: true,
            message: 'User registered successfully',
            user: {
                token,
                id: user._id,
                name: user.name,
                email: user.email,
                age: user.age
            }
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
});

// Login a User
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

        res.status(200).send({
            success: true,
            message: 'Logged in successfully',
            user: {
                token,
                id: user._id,
                name: user.name,
                email: user.email,
                age: user.age
            }
        });
    } catch (err) {
        res.status(500).send({
            success: false,
            message: err.message
        });
    }
});

// Logout a User
router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(200).send({
        success: true,
        message: 'Logged out successfully'
    });
});

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
    res.send({
        success: true,
        message: 'You have accessed a protected route',
        user: req.user
    });
});

module.exports = router;
