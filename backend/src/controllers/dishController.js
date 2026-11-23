const mongoose = require('mongoose');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const dishCategories = require('../utils/dishCategories');

const editableFields = ['nom', 'imageUrl', 'description', 'prix', 'categorie', 'disponible'];

function validateDishInput(body, requireAllFields) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Données du plat invalides' };
    }

    if (Object.keys(body).some((field) => !editableFields.includes(field))) {
        return { error: 'Champ du plat invalide' };
    }

    if (requireAllFields && editableFields.some((field) => !(field in body))) {
        return { error: 'Tous les champs du plat doivent être renseignés' };
    }

    const updates = {};
    if ('nom' in body) {
        if (typeof body.nom !== 'string' || body.nom.trim().length < 2 || body.nom.trim().length > 120) {
            return { error: 'Le nom doit contenir entre 2 et 120 caractères' };
        }
        updates.nom = body.nom.trim();
    }
    if ('imageUrl' in body) {
        if (typeof body.imageUrl !== 'string' || body.imageUrl.trim().length > 1000) {
            return { error: "L'URL de l'image est invalide" };
        }
        updates.imageUrl = body.imageUrl.trim();
    }
    if ('description' in body) {
        if (typeof body.description !== 'string' || !body.description.trim() || body.description.trim().length > 1000) {
            return { error: 'La description est invalide' };
        }
        updates.description = body.description.trim();
    }
    if ('prix' in body) {
        if (typeof body.prix !== 'number' || !Number.isFinite(body.prix) || body.prix < 0 || body.prix > 100000) {
            return { error: 'Le prix doit être compris entre 0 et 100000 DT' };
        }
        updates.prix = body.prix;
    }
    if ('categorie' in body) {
        if (typeof body.categorie !== 'string' || !dishCategories.includes(body.categorie)) {
            return { error: 'Catégorie de plat invalide' };
        }
        updates.categorie = body.categorie;
    }
    if ('disponible' in body) {
        if (typeof body.disponible !== 'boolean') {
            return { error: 'La disponibilité doit être un booléen' };
        }
        updates.disponible = body.disponible;
    }

    if (!Object.keys(updates).length) {
        return { error: 'Aucune donnée de plat valide fournie' };
    }
    return { updates };
}

async function findRestaurant(req, res, ownerOnly) {
    if (!mongoose.Types.ObjectId.isValid(req.params.restaurantId)) {
        res.status(400).json({ message: 'Identifiant restaurant invalide' });
        return null;
    }

    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant || (!ownerOnly && restaurant.status !== 'approved')) {
        res.status(404).json({ message: 'Restaurant introuvable' });
        return null;
    }

    if (ownerOnly && !restaurant.owner.equals(req.user._id)) {
        res.status(403).json({ message: 'Vous ne pouvez gérer que les plats de vos restaurants' });
        return null;
    }
    return restaurant;
}

exports.listPublicDishes = async (req, res) => {
    try {
        const restaurant = await findRestaurant(req, res, false);
        if (!restaurant) return;

        const dishes = await Dish.find({ restaurant: restaurant._id }).sort({ categorie: 1, nom: 1, _id: 1 });
        return res.status(200).json({ dishes });
    } catch (error) {
        console.error('List public dishes error:', error);
        return res.status(500).json({ message: 'Impossible de charger le menu' });
    }
};

exports.listManagedDishes = async (req, res) => {
    try {
        const restaurant = await findRestaurant(req, res, true);
        if (!restaurant) return;

        const dishes = await Dish.find({ restaurant: restaurant._id }).sort({ categorie: 1, nom: 1, _id: 1 });
        return res.status(200).json({ restaurant, dishes });
    } catch (error) {
        console.error('List managed dishes error:', error);
        return res.status(500).json({ message: 'Impossible de charger le menu' });
    }
};

exports.createDish = async (req, res) => {
    const validation = validateDishInput(req.body, true);
    if (validation.error) return res.status(400).json({ message: validation.error });

    try {
        const restaurant = await findRestaurant(req, res, true);
        if (!restaurant) return;

        const dish = await Dish.create({ ...validation.updates, restaurant: restaurant._id });
        return res.status(201).json({ message: 'Plat ajouté au menu', dish });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error('Create dish error:', error);
        return res.status(500).json({ message: 'Impossible de créer le plat' });
    }
};

exports.updateDish = async (req, res) => {
    const validation = validateDishInput(req.body, false);
    if (validation.error) return res.status(400).json({ message: validation.error });

    try {
        const restaurant = await findRestaurant(req, res, true);
        if (!restaurant) return;
        if (!mongoose.Types.ObjectId.isValid(req.params.dishId)) {
            return res.status(400).json({ message: 'Identifiant plat invalide' });
        }

        const dish = await Dish.findOne({ _id: req.params.dishId, restaurant: restaurant._id });
        if (!dish) return res.status(404).json({ message: 'Plat introuvable' });

        Object.assign(dish, validation.updates);
        await dish.save();
        return res.status(200).json({ message: 'Plat mis à jour', dish });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error('Update dish error:', error);
        return res.status(500).json({ message: 'Impossible de mettre à jour le plat' });
    }
};

exports.deleteDish = async (req, res) => {
    try {
        const restaurant = await findRestaurant(req, res, true);
        if (!restaurant) return;
        if (!mongoose.Types.ObjectId.isValid(req.params.dishId)) {
            return res.status(400).json({ message: 'Identifiant plat invalide' });
        }

        const dish = await Dish.findOne({ _id: req.params.dishId, restaurant: restaurant._id });
        if (!dish) return res.status(404).json({ message: 'Plat introuvable' });

        await dish.deleteOne();
        return res.status(200).json({ message: 'Plat supprimé du menu' });
    } catch (error) {
        console.error('Delete dish error:', error);
        return res.status(500).json({ message: 'Impossible de supprimer le plat' });
    }
};
