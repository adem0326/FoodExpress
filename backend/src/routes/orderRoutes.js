const express = require('express');
const authorizeRoles = require('../middleware/authorizeRoles');
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController');
const {
    getRestaurantOrders,
    getRestaurantOrderById,
    updateOrderStatus
} = require('../controllers/orderProcessingController');

const router = express.Router();

// Etudiant 4 : creation et historique client.
router.post('/', authorizeRoles('client'), createOrder);
router.get('/my-orders', authorizeRoles('client'), getMyOrders); // avant /:id
router.get('/restaurant', authorizeRoles('restaurateur'), getRestaurantOrders);
router.get('/restaurant/:id', authorizeRoles('restaurateur'), getRestaurantOrderById);
router.get('/:id', authorizeRoles('client', 'admin'), getOrderById);
router.put('/:id/status', authorizeRoles('restaurateur'), updateOrderStatus);

module.exports = router;
