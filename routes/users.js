const express = require('express')
const User = require('../models/User')
const mongoose = require('mongoose')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// JWT Secret - replace this with your actual secret or use an environment variable
const JWT_SECRET = crypto.randomBytes(64).toString('hex')

// Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password, age } = req.body

    try {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).send({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ name, email, password: hashedPassword, age });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).send({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
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

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate a token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).send({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
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

// Create a new user
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        const result = await user.save();
        res.status(201).send({
            success: true,
            user: result,
            request: req.body // Include request body in the response
        });
    } catch (err) {
        if (err.code === 11000) { // Check if the error code is for duplicate key
            res.status(400).send({
                success: false,
                error: 'Duplicate key error: A user with this email already exists.',
                request: req.body // Include request body in the response even on error
            });
        } else {
            res.status(400).send({
                success: false,
                error: err.message,
                request: req.body // Include request body in the response even on error
            });
        }
    }
});

// Get all users
router.get('/users', async (req, res) => {
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
router.get('/users/:id', async (req, res) => {
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
router.put('/users/:id', async (req, res) => {
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
});

// Delete a user by ID
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send({
                success: false,
                error: 'User not found',
                request: req.params
            });
        }
        res.status(200).send({
            success: true,
            message: 'User deleted successfully',
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

module.exports = router;
