const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    const token = authorization.slice(7).trim();
    if (!token) {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur introuvable' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Ce compte est désactivé' });
        }
        req.user = user;
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expirée' });
        }
        return res.status(401).json({ message: 'Token invalide' });
    }
};
