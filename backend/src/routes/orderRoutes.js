const express = require('express');
const authorizeRoles = require('../middleware/authorizeRoles');
const { createOrder, getMyOrders, getOrderById } = require('../controllers/orderController');

const router = express.Router();

// Etudiant 4 : creation et historique client.
router.post('/', authorizeRoles('client'), createOrder);
router.get('/my-orders', authorizeRoles('client'), getMyOrders); // avant /:id
router.get('/:id', authorizeRoles('client', 'admin'), getOrderById);

// Etudiant 5 ajoutera ici : GET /restaurant, PUT /:id/status, statistiques.

module.exports = router;
