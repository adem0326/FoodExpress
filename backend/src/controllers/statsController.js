// Etudiant 5 : statistiques restaurateur et administrateur.
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

const round3 = (value) => Math.round(value * 1000) / 1000;

// Le chiffre d'affaires ne compte que les commandes livrees.
const REVENUE_STATUS = 'livree';

// GET /api/stats/restaurateur : indicateurs du restaurateur connecte.
exports.getRestaurateurStats = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ owner: req.user._id }).select('_id');
        const restaurantIds = restaurants.map((restaurant) => restaurant._id);
        const match = { restaurant: { $in: restaurantIds } };

        const [byStatus, revenueAgg, topDishes] = await Promise.all([
            Order.aggregate([
                { $match: match },
                { $group: { _id: '$statut', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { ...match, statut: REVENUE_STATUS } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            // Plats les plus commandes (hors commandes annulees).
            Order.aggregate([
                { $match: { ...match, statut: { $ne: 'annulee' } } },
                { $unwind: '$articles' },
                {
                    $group: {
                        _id: '$articles.plat',
                        nom: { $first: '$articles.nom' },
                        quantite: { $sum: '$articles.quantite' }
                    }
                },
                { $sort: { quantite: -1 } },
                { $limit: 5 }
            ])
        ]);

        const counts = Object.fromEntries(byStatus.map((row) => [row._id, row.count]));
        const totalOrders = byStatus.reduce((sum, row) => sum + row.count, 0);

        return res.json({
            totalOrders,
            pendingOrders: counts.en_attente || 0,
            acceptedOrders: counts.acceptee || 0,
            byStatus: counts,
            revenue: round3(revenueAgg[0] ? revenueAgg[0].total : 0),
            topDishes: topDishes.map((dish) => ({ plat: dish._id, nom: dish.nom, quantite: dish.quantite }))
        });
    } catch (error) {
        console.error('getRestaurateurStats error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors du calcul des statistiques' });
    }
};

// GET /api/stats/admin : statistiques globales de la plateforme.
exports.getAdminStats = async (req, res) => {
    try {
        const [clients, restaurants, orders, revenueAgg] = await Promise.all([
            User.countDocuments({ role: 'client' }),
            Restaurant.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                { $match: { statut: REVENUE_STATUS } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ])
        ]);

        return res.json({
            clients,
            restaurants,
            orders,
            revenue: round3(revenueAgg[0] ? revenueAgg[0].total : 0)
        });
    } catch (error) {
        console.error('getAdminStats error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors du calcul des statistiques' });
    }
};
