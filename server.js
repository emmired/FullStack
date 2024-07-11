const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/users');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const dbURI = 'mongodb://localhost:27017/users';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

// Routes
app.use('/api', userRoutes); // Ensure this is correctly mounted

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
