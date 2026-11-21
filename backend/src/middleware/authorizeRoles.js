const authMiddleware = require('./authMiddleware');

module.exports = (...allowedRoles) => {
    const authorize = (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Vous ne disposez pas des permissions nécessaires' });
        }
        return next();
    };

    return (req, res, next) => {
        if (req.user) {
            return authorize(req, res, next);
        }
        return authMiddleware(req, res, (error) => {
            if (error) return next(error);
            return authorize(req, res, next);
        });
    };
};
