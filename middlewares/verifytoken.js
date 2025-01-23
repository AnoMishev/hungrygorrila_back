const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).send("Token is required.");
    }

    // Remove 'Bearer ' from token if it's included
    const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

    jwt.verify(tokenWithoutBearer, 'secret', (err, decoded) => {
        if (err) {
            return res.status(401).send("Unauthorized.");
        }

        // Attach the decoded user info to the request
        req.user = decoded;
        next(); // Proceed to the next middleware or route handler
    });
}

module.exports = verifyToken;
