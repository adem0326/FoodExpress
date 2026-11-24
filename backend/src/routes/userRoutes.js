const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const usersController = require('../controllers/usersController');

const router = express.Router();

router.use(authMiddleware, authorizeRoles('admin'));
router.param('id', (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Identifiant utilisateur invalide' });
    }
    return next();
});

router.get('/', usersController.listUsers);
router.get('/:id', usersController.getUser);
router.put('/:id', usersController.updateUser);
router.patch('/:id/password', usersController.updateUserPassword);
router.patch('/:id/status', usersController.updateUserStatus);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
