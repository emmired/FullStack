const jwt = require('jsonwebtoken');
const JWT_SECRET = '9878924f604a926a44cacd21fd5e9b8061c2beae286f570902d16b0229f224f9fcf4e3d046e682e614c6971327b49409626de20248677f6fcbaaba3ef063147a'; // Replace with your actual secret

const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).send({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).send({
            success: false,
            message: 'Invalid token.'
        });
    }
};

module.exports = authenticate;