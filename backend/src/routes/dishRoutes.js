const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizeRoles');
const dishController = require('../controllers/dishController');

const router = express.Router({ mergeParams: true });

router.get('/', dishController.listPublicDishes);
router.get('/manage', authMiddleware, authorizeRoles('restaurateur'), dishController.listManagedDishes);
router.post('/', authMiddleware, authorizeRoles('restaurateur'), dishController.createDish);
router.put('/:dishId', authMiddleware, authorizeRoles('restaurateur'), dishController.updateDish);
router.delete('/:dishId', authMiddleware, authorizeRoles('restaurateur'), dishController.deleteDish);

module.exports = router;
