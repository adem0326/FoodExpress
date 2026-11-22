// Charge Express pour construire les routes HTTP.
const express = require('express');
// Charge les middlewares d'authentification partages par l'etudiant 1.
const authMiddleware = require('../middleware/authMiddleware');
// Charge le middleware d'autorisation par role partage.
const authorizeRoles = require('../middleware/authorizeRoles');
// Charge les fonctions du controleur restaurant.
const restaurantController = require('../controllers/restaurantController');

// Cree un routeur Express dedie aux restaurants.
const router = express.Router();

// Publie la liste publique avec recherche, filtres et tri.
router.get('/', restaurantController.listRestaurants);
// Publie les restaurants mis en avant.
router.get('/featured', restaurantController.listFeaturedRestaurants);
// Permet au restaurateur connecte de lister ses propres restaurants.
router.get('/my', authMiddleware, authorizeRoles('restaurateur'), restaurantController.listMyRestaurants);
// Permet a l'administrateur de lister tous les restaurants.
router.get('/admin/all', authMiddleware, authorizeRoles('admin'), restaurantController.listAdminRestaurants);
// Permet de consulter les details publics d'un restaurant.
router.get('/:id', restaurantController.getRestaurant);
// Permet au restaurateur ou a l'administrateur de creer un restaurant.
router.post('/', authMiddleware, authorizeRoles('restaurateur', 'admin'), restaurantController.createRestaurant);
// Permet au proprietaire ou a l'administrateur de modifier un restaurant.
router.put('/:id', authMiddleware, authorizeRoles('restaurateur', 'admin'), restaurantController.updateRestaurant);
// Permet au proprietaire ou a l'administrateur de supprimer un restaurant.
router.delete('/:id', authMiddleware, authorizeRoles('restaurateur', 'admin'), restaurantController.deleteRestaurant);
// Permet uniquement a l'administrateur de valider ou suspendre un restaurant.
router.patch('/:id/status', authMiddleware, authorizeRoles('admin'), restaurantController.updateRestaurantStatus);

// Exporte le routeur pour l'enregistrer dans server.js.
module.exports = router;
