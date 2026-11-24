// Etudiant 5 : traitement des commandes cote restaurateur.
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

// Cycle de vie autorise : statut actuel -> statuts suivants possibles.
// "livree" et "annulee" sont des etats finaux (une commande livree ne peut plus etre modifiee).
const ALLOWED_TRANSITIONS = {
    en_attente: ['acceptee', 'annulee'],
    acceptee: ['en_preparation', 'annulee'],
    en_preparation: ['en_livraison', 'annulee'],
    en_livraison: ['livree'],
    livree: [],
    annulee: []
};

// Retourne les identifiants des restaurants appartenant au restaurateur connecte.
async function getOwnedRestaurantIds(userId) {
    const restaurants = await Restaurant.find({ owner: userId }).select('_id');
    return restaurants.map((restaurant) => restaurant._id);
}

// GET /api/orders/restaurant?statut=en_attente&page=1&limit=10
// Liste les commandes recues par les restaurants du restaurateur connecte.
exports.getRestaurantOrders = async (req, res) => {
    try {
        const restaurantIds = await getOwnedRestaurantIds(req.user._id);
        const filter = { restaurant: { $in: restaurantIds } };

        if (req.query.statut) {
            if (!Order.STATUSES.includes(req.query.statut)) {
                return res.status(400).json({ message: 'Statut invalide' });
            }
            filter.statut = req.query.statut;
        }

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('client', 'nom prenom telephone')
                .populate('restaurant', 'nom'),
            Order.countDocuments(filter)
        ]);

        return res.json({
            orders,
            pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) }
        });
    } catch (error) {
        console.error('getRestaurantOrders error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors du chargement des commandes' });
    }
};

// GET /api/orders/restaurant/:id : detail d'une commande recue (restaurateur proprietaire).
exports.getRestaurantOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('client', 'nom prenom telephone')
            .populate('restaurant', 'nom adresse owner');
        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }
        if (!order.restaurant.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Cette commande ne concerne pas vos restaurants' });
        }
        return res.json(order);
    } catch (error) {
        console.error('getRestaurantOrderById error:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/orders/:id/status  { statut: 'acceptee' }
// Met a jour le statut en respectant le cycle de vie et la propriete du restaurant.
exports.updateOrderStatus = async (req, res) => {
    try {
        const { statut } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Identifiant invalide' });
        }
        if (!Order.STATUSES.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const order = await Order.findById(req.params.id).populate('restaurant', 'owner');
        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }
        // Regle 7 : un restaurateur ne modifie que les commandes de ses restaurants.
        if (!order.restaurant || !order.restaurant.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Cette commande ne concerne pas vos restaurants' });
        }
        // Regle 9 : une commande livree (ou annulee) ne peut plus etre modifiee.
        if (order.statut === 'livree') {
            return res.status(400).json({ message: 'Une commande livrée ne peut plus être modifiée' });
        }
        if (order.statut === 'annulee') {
            return res.status(400).json({ message: 'Une commande annulée ne peut plus être modifiée' });
        }
        // Regle 8 : respecter le cycle de vie.
        if (!ALLOWED_TRANSITIONS[order.statut].includes(statut)) {
            return res.status(400).json({
                message: `Transition interdite : ${order.statut} → ${statut}`,
                allowed: ALLOWED_TRANSITIONS[order.statut]
            });
        }

        order.statut = statut;
        await order.save();

        return res.json({ message: 'Statut mis à jour', order });
    } catch (error) {
        console.error('updateOrderStatus error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du statut' });
    }
};

exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;
