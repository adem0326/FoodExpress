const mongoose = require('mongoose');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

// Les dinars tunisiens ont 3 decimales (millimes).
const round3 = (value) => Math.round(value * 1000) / 1000;

// POST /api/orders : cree une commande a partir du panier du client.
exports.createOrder = async (req, res) => {
    try {
        const { articles, adresseLivraison, remarque, modePaiement } = req.body;

        if (!Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({ message: 'La commande doit contenir au moins un article' });
        }

        // Valide chaque ligne et fusionne les doublons (meme plat envoye deux fois).
        const quantities = new Map();
        for (const item of articles) {
            const platId = item && item.plat;
            const quantite = Number(item && item.quantite);
            if (!mongoose.isValidObjectId(platId)) {
                return res.status(400).json({ message: 'Identifiant de plat invalide' });
            }
            if (!Number.isInteger(quantite) || quantite < 1) {
                return res.status(400).json({ message: 'La quantité de chaque article doit être un entier supérieur ou égal à 1' });
            }
            const key = String(platId);
            quantities.set(key, (quantities.get(key) || 0) + quantite);
        }

        if (typeof adresseLivraison !== 'string' || !adresseLivraison.trim()) {
            return res.status(400).json({ message: "L'adresse de livraison est requise" });
        }

        const paiement = modePaiement || 'livraison';
        if (paiement !== 'livraison') {
            return res.status(400).json({ message: 'Mode de paiement non supporté' });
        }

        // Les prix et noms viennent TOUJOURS de la base, jamais d'Angular.
        const dishes = await Dish.find({ _id: { $in: [...quantities.keys()] } });
        if (dishes.length !== quantities.size) {
            return res.status(400).json({ message: 'Un ou plusieurs plats sont introuvables' });
        }

        const unavailable = dishes.filter((dish) => !dish.disponible);
        if (unavailable.length > 0) {
            return res.status(400).json({
                message: `Plat(s) indisponible(s) : ${unavailable.map((dish) => dish.nom).join(', ')}`
            });
        }

        // Une commande concerne un seul restaurant.
        const restaurantIds = new Set(dishes.map((dish) => String(dish.restaurant)));
        if (restaurantIds.size > 1) {
            return res.status(400).json({ message: 'Tous les plats doivent appartenir au même restaurant' });
        }

        const restaurant = await Restaurant.findById([...restaurantIds][0]);
        if (!restaurant || restaurant.status !== 'approved') {
            return res.status(400).json({ message: "Ce restaurant n'est pas disponible" });
        }
        if (!restaurant.isOpen) {
            return res.status(400).json({ message: 'Ce restaurant est actuellement fermé' });
        }

        const lignes = dishes.map((dish) => ({
            plat: dish._id,
            nom: dish.nom,
            quantite: quantities.get(String(dish._id)),
            prixUnitaire: dish.prix
        }));

        const sousTotal = round3(lignes.reduce((sum, ligne) => sum + ligne.prixUnitaire * ligne.quantite, 0));
        const fraisLivraison = restaurant.deliveryFee;
        const total = round3(sousTotal + fraisLivraison);

        const order = await Order.create({
            client: req.user._id,
            restaurant: restaurant._id,
            articles: lignes,
            adresseLivraison: adresseLivraison.trim(),
            remarque: typeof remarque === 'string' ? remarque : '',
            sousTotal,
            fraisLivraison,
            total,
            modePaiement: paiement
        });

        return res.status(201).json(order);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        console.error('createOrder error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la création de la commande' });
    }
};

// GET /api/orders/my-orders : historique du client connecte.
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ client: req.user._id })
            .sort({ createdAt: -1 })
            .populate('restaurant', 'nom imageUrl');
        return res.json(orders);
    } catch (error) {
        console.error('getMyOrders error:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/orders/:id : detail d'une commande (proprietaire ou admin).
exports.getOrderById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Identifiant invalide' });
        }
        const order = await Order.findById(req.params.id).populate('restaurant', 'nom imageUrl adresse');
        if (!order) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }
        const isOwner = String(order.client) === String(req.user._id);
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Vous ne disposez pas des permissions nécessaires' });
        }
        return res.json(order);
    } catch (error) {
        console.error('getOrderById error:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
