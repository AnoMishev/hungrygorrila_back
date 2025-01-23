const jwt = require('jsonwebtoken');

function verifyAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).send("Admin privileges required.");
    }

    next(); // Proceed to the next middleware or route handler
}

module.exports = verifyAdmin;
