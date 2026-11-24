const express = require('express');
const authorizeRoles = require('../middleware/authorizeRoles');
const { getRestaurateurStats, getAdminStats } = require('../controllers/statsController');

const router = express.Router();

router.get('/restaurateur', authorizeRoles('restaurateur'), getRestaurateurStats);
router.get('/admin', authorizeRoles('admin'), getAdminStats);

module.exports = router;
