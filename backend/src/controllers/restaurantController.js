// Charge Mongoose pour valider les identifiants MongoDB.
const mongoose = require('mongoose');
// Charge le modele Restaurant utilise par toutes les operations.
const Restaurant = require('../models/Restaurant');

// Definit les champs modifiables depuis les formulaires.
const editableFields = [
    'nom',
    'description',
    'adresse',
    'imageUrl',
    'cuisineType',
    'horaires',
    'isOpen',
    'deliveryFee',
    'isFeatured'
];

// Echappe les caracteres speciaux utilises dans une expression reguliere.
function escapeRegex(value) {
    // Remplace les metacaracteres regex par leur version echappee.
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Valide et nettoie les champs communs envoyes par Angular.
function validateRestaurantInput(body, requireAllFields) {
    // Rejette les corps absents ou les tableaux comme objet principal.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        // Retourne une erreur lisible au controleur appelant.
        return { error: 'Données du restaurant invalides' };
    }
    // Rejette les proprietes qui ne font pas partie du formulaire.
    const unknownField = Object.keys(body).find((field) => !editableFields.includes(field));
    if (unknownField) {
        // Retourne une erreur pour empecher les modifications arbitraires.
        return { error: 'Champ restaurant invalide' };
    }
    // Exige tous les champs principaux lors de la creation.
    if (requireAllFields) {
        // Liste les champs obligatoires cote API.
        const requiredFields = ['nom', 'description', 'adresse', 'cuisineType', 'deliveryFee'];
        // Verifie la presence de chaque champ obligatoire.
        const missingField = requiredFields.find((field) => !(field in body));
        if (missingField) {
            // Retourne un message explicite si un champ manque.
            return { error: 'Tous les champs obligatoires doivent etre renseignes' };
        }
    }
    // Prepare un objet contenant uniquement les valeurs nettoyees.
    const updates = {};
    // Nettoie le nom lorsqu'il est present.
    if ('nom' in body) {
        if (typeof body.nom !== 'string' || body.nom.trim().length < 2 || body.nom.trim().length > 120) {
            return { error: 'Le nom doit contenir entre 2 et 120 caracteres' };
        }
        updates.nom = body.nom.trim();
    }
    // Nettoie la description lorsqu'elle est presente.
    if ('description' in body) {
        if (typeof body.description !== 'string' || !body.description.trim() || body.description.trim().length > 1000) {
            return { error: 'La description est invalide' };
        }
        updates.description = body.description.trim();
    }
    // Nettoie l'adresse lorsqu'elle est presente.
    if ('adresse' in body) {
        if (typeof body.adresse !== 'string' || !body.adresse.trim() || body.adresse.trim().length > 300) {
            return { error: "L'adresse est invalide" };
        }
        updates.adresse = body.adresse.trim();
    }
    // Nettoie l'URL de l'image lorsqu'elle est presente.
    if ('imageUrl' in body) {
        if (typeof body.imageUrl !== 'string' || body.imageUrl.trim().length > 1000) {
            return { error: "L'URL de l'image est invalide" };
        }
        updates.imageUrl = body.imageUrl.trim();
    }
    // Nettoie le type de cuisine lorsqu'il est present.
    if ('cuisineType' in body) {
        if (typeof body.cuisineType !== 'string' || !body.cuisineType.trim() || body.cuisineType.trim().length > 80) {
            return { error: 'Le type de cuisine est invalide' };
        }
        updates.cuisineType = body.cuisineType.trim();
    }
    // Nettoie les horaires lorsqu'ils sont presents.
    if ('horaires' in body) {
        if (typeof body.horaires !== 'string' || body.horaires.trim().length > 300) {
            return { error: 'Les horaires sont invalides' };
        }
        updates.horaires = body.horaires.trim();
    }
    // Valide le booleen isOpen lorsqu'il est present.
    if ('isOpen' in body) {
        if (typeof body.isOpen !== 'boolean') {
            return { error: 'Le statut ouvert ferme doit etre un booleen' };
        }
        updates.isOpen = body.isOpen;
    }
    // Convertit les frais de livraison en nombre lorsqu'ils sont presents.
    if ('deliveryFee' in body) {
        const fee = Number(body.deliveryFee);
        if (!Number.isFinite(fee) || fee < 0 || fee > 1000) {
            return { error: 'Les frais de livraison doivent être compris entre 0 et 1000' };
        }
        updates.deliveryFee = fee;
    }
    // Valide le booleen isFeatured lorsqu'il est present.
    if ('isFeatured' in body) {
        if (typeof body.isFeatured !== 'boolean') {
            return { error: 'La mise en avant doit etre un booleen' };
        }
        updates.isFeatured = body.isFeatured;
    }
    // Indique qu'aucun objet vide ne doit être accepte.
    if (!Object.keys(updates).length) {
        return { error: 'Aucune donnée restaurant valide fournie' };
    }
    // Retourne les valeurs nettoyees au controleur.
    return { updates };
}

// Liste les restaurants publics avec recherche, filtres et tri.
exports.listRestaurants = async (req, res) => {
    // Limite les parametres autorises pour eviter les filtres inconnus.
    const allowedQueryKeys = ['search', 'cuisine', 'availability', 'sort', 'page', 'limit'];
    if (Object.keys(req.query).some((key) => !allowedQueryKeys.includes(key))) {
        return res.status(400).json({ message: 'Paramètres de recherche invalides' });
    }
    // Lit les valeurs de pagination fournies par le navigateur.
    const parsePage = (value, fallback) => {
        if (value === undefined) return fallback;
        if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
        const number = Number(value);
        return Number.isSafeInteger(number) && number <= 100000 ? number : null;
    };
    // Lit les valeurs de limite fournies par le navigateur.
    const page = parsePage(req.query.page, 1);
    const limit = parsePage(req.query.limit, 12);
    // Valide les autres filtres texte.
    if (page === null || limit === null || limit > 100) {
        return res.status(400).json({ message: 'Paramètres de pagination invalides' });
    }
    // Prepare les filtres visibles uniquement pour les restaurants approuves.
    const filter = { status: 'approved' };
    // Ajoute la recherche par nom lorsque demandee.
    if (req.query.search !== undefined) {
        if (typeof req.query.search !== 'string' || req.query.search.length > 100) {
            return res.status(400).json({ message: 'Recherche invalide' });
        }
        if (req.query.search.trim()) {
            filter.nom = { $regex: escapeRegex(req.query.search.trim()), $options: 'i' };
        }
    }
    // Ajoute le filtre de type de cuisine.
    if (req.query.cuisine !== undefined) {
        if (typeof req.query.cuisine !== 'string' || req.query.cuisine.length > 80) {
            return res.status(400).json({ message: 'Type de cuisine invalide' });
        }
        if (req.query.cuisine) {
            filter.cuisineType = { $regex: escapeRegex(req.query.cuisine), $options: 'i' };
        }
    }
    // Ajoute le filtre de disponibilite ouverte ou fermee.
    if (req.query.availability !== undefined) {
        if (!['all', 'open', 'closed'].includes(req.query.availability)) {
            return res.status(400).json({ message: 'Disponibilité invalide' });
        }
        if (req.query.availability === 'open') filter.isOpen = true;
        if (req.query.availability === 'closed') filter.isOpen = false;
    }
    // Choisit le tri alphabetique ou les elements mis en avant.
    let sort = { nom: 1, _id: 1 };
    if (req.query.sort === 'featured') sort = { isFeatured: -1, nom: 1, _id: 1 };
    if (req.query.sort !== undefined && !['alphabetical', 'featured'].includes(req.query.sort)) {
        return res.status(400).json({ message: 'Tri invalide' });
    }
    // Execute les lectures MongoDB avec gestion d'erreur.
    try {
        // Compte le nombre total correspondant aux filtres.
        const total = await Restaurant.countDocuments(filter);
        // Calcule le nombre total de pages.
        const totalPages = Math.ceil(total / limit);
        // Corrige la page demandee si elle dépasse la derniere page.
        const currentPage = totalPages ? Math.min(page, totalPages) : 1;
        // Charge les restaurants pagines et leur proprietaire.
        const restaurants = await Restaurant.find(filter)
            .populate('owner', 'nom prenom email')
            .sort(sort)
            .skip((currentPage - 1) * limit)
            .limit(limit);
        // Retourne les restaurants et leur pagination.
        return res.status(200).json({
            restaurants,
            pagination: { page: currentPage, limit, total, totalPages }
        });
    } catch (error) {
        // Trace l'erreur serveur pour faciliter le diagnostic.
        console.error('List restaurants error:', error);
        // Retourne une erreur sans details internes.
        return res.status(500).json({ message: 'Impossible de charger les restaurants' });
    }
};

// Recupere les restaurants mis en avant pour la page d'accueil.
exports.listFeaturedRestaurants = async (req, res) => {
    try {
        // Charge au maximum huit restaurants approuves et ouverts.
        const restaurants = await Restaurant.find({
            status: 'approved',
            isFeatured: true,
            isOpen: true
        }).sort({ nom: 1, _id: 1 }).limit(8);
        // Retourne les restaurants mis en avant.
        return res.status(200).json({ restaurants });
    } catch (error) {
        // Trace l'erreur serveur.
        console.error('List featured restaurants error:', error);
        // Retourne une erreur generale.
        return res.status(500).json({ message: 'Impossible de charger les restaurants mis en avant' });
    }
};

// Recupere les details publics d'un restaurant approuve.
exports.getRestaurant = async (req, res) => {
    try {
        // Recherche le restaurant par identifiant avec son proprietaire.
        const restaurant = await Restaurant.findOne({
            _id: req.params.id,
            status: 'approved'
        }).populate('owner', 'nom prenom');
        // Retourne une erreur si le restaurant est absent ou non publie.
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant introuvable' });
        }
        // Retourne le restaurant demande.
        return res.status(200).json({ restaurant });
    } catch (error) {
        // Trace les erreurs inattendues.
        console.error('Get restaurant error:', error);
        // Retourne une erreur generale.
        return res.status(500).json({ message: 'Impossible de charger ce restaurant' });
    }
};

// Liste les restaurants du restaurateur connecte.
exports.listMyRestaurants = async (req, res) => {
    try {
        // Recherche uniquement les documents dont owner correspond au connecte.
        const restaurants = await Restaurant.find({ owner: req.user._id }).sort({ createdAt: -1, _id: 1 });
        // Retourne la liste personnelle.
        return res.status(200).json({ restaurants });
    } catch (error) {
        // Trace l'erreur serveur.
        console.error('List my restaurants error:', error);
        // Retourne une erreur generale.
        return res.status(500).json({ message: 'Impossible de charger vos restaurants' });
    }
};

// Liste tous les restaurants pour l'administration.
exports.listAdminRestaurants = async (req, res) => {
    try {
        // Charge tous les statuts avec les informations du proprietaire.
        const restaurants = await Restaurant.find({})
            .populate('owner', 'nom prenom email')
            .sort({ createdAt: -1, _id: 1 });
        // Retourne tous les restaurants.
        return res.status(200).json({ restaurants });
    } catch (error) {
        // Trace l'erreur serveur.
        console.error('List admin restaurants error:', error);
        // Retourne une erreur generale.
        return res.status(500).json({ message: 'Impossible de charger les restaurants' });
    }
};

// Cree un restaurant pour le restaurateur connecte.
exports.createRestaurant = async (req, res) => {
    // Valide toutes les informations obligatoires.
    const validation = validateRestaurantInput(req.body, true);
    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }
    try {
        // Un restaurateur ne peut pas décider seul de mettre son restaurant en avant.
        if (req.user.role !== 'admin') {
            delete validation.updates.isFeatured;
        }
        // Le proprietaire est toujours pris depuis le token, pas depuis le corps.
        const restaurant = await Restaurant.create({
            ...validation.updates,
            owner: req.user._id,
            status: 'pending'
        });
        // Retourne le restaurant cree.
        return res.status(201).json({
            message: 'Restaurant créé avec succès; en attente de validation',
            restaurant
        });
    } catch (error) {
        // Transforme une erreur de validation Mongoose en erreur lisible.
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        // Trace les erreurs inattendues.
        console.error('Create restaurant error:', error);
        // Retourne une erreur generale.
        return res.status(500).json({ message: 'Impossible de créer le restaurant' });
    }
};

// Charge un restaurant puis vérifie que l'appelant peut le modifier.
async function findOwnedRestaurant(req, res) {
    // Vérifie que l'identifiant fourni est bien un ObjectId MongoDB.
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        // Retourne une erreur spécifique à l'identifiant.
        res.status(400).json({ message: 'Identifiant restaurant invalide' });
        // Signale au contrôleur appelant que la recherche est terminée.
        return null;
    }
    // Charge le restaurant demandé.
    const restaurant = await Restaurant.findById(req.params.id);
    // Retourne une erreur si le restaurant n'existe pas.
    if (!restaurant) {
        res.status(404).json({ message: 'Restaurant introuvable' });
        return null;
    }
    // Autorise les administrateurs à gérer tous les restaurants.
    if (req.user.role === 'admin') {
        return restaurant;
    }
    // Autorise uniquement le propriétaire restaurateur.
    if (!restaurant.owner.equals(req.user._id)) {
        res.status(403).json({ message: 'Vous ne pouvez gérer que vos propres restaurants' });
        return null;
    }
    // Retourne le restaurant appartenant au restaurateur.
    return restaurant;
}

// Modifie un restaurant existant.
exports.updateRestaurant = async (req, res) => {
    // Valide les champs fournis en mode mise à jour.
    const validation = validateRestaurantInput(req.body, false);
    if (validation.error) {
        return res.status(400).json({ message: validation.error });
    }
    try {
        // Charge le restaurant et vérifie les droits d'accès.
        const restaurant = await findOwnedRestaurant(req, res);
        if (!restaurant) return;
        // Un restaurateur ne peut pas modifier la mise en avant administrative.
        if (req.user.role !== 'admin') {
            delete validation.updates.isFeatured;
        }
        // Applique les champs validés au document.
        Object.assign(restaurant, validation.updates);
        // Sauvegarde les modifications dans MongoDB.
        await restaurant.save();
        // Retourne le restaurant mis à jour.
        return res.status(200).json({
            message: 'Restaurant mis à jour',
            restaurant
        });
    } catch (error) {
        // Transforme une erreur de validation Mongoose en message lisible.
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        // Trace les erreurs inattendues.
        console.error('Update restaurant error:', error);
        // Retourne une erreur générale.
        return res.status(500).json({ message: 'Impossible de mettre à jour ce restaurant' });
    }
};

// Supprime définitivement un restaurant.
exports.deleteRestaurant = async (req, res) => {
    try {
        // Charge le restaurant et vérifie les droits d'accès.
        const restaurant = await findOwnedRestaurant(req, res);
        if (!restaurant) return;
        // Supprime le document MongoDB.
        await restaurant.deleteOne();
        // Confirme la suppression.
        return res.status(200).json({ message: 'Restaurant supprimé' });
    } catch (error) {
        // Trace l'erreur serveur.
        console.error('Delete restaurant error:', error);
        // Retourne une erreur générale.
        return res.status(500).json({ message: 'Impossible de supprimer ce restaurant' });
    }
};

// Valide ou suspend un restaurant depuis l'administration.
exports.updateRestaurantStatus = async (req, res) => {
    // Vérifie que le corps contient uniquement le statut attendu.
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) ||
        Object.keys(req.body).length !== 1 || typeof req.body.status !== 'string') {
        return res.status(400).json({ message: 'Le statut du restaurant est requis' });
    }
    // Vérifie que le statut appartient aux valeurs autorisées.
    if (!['approved', 'suspended', 'pending'].includes(req.body.status)) {
        return res.status(400).json({ message: 'Statut restaurant invalide' });
    }
    try {
        // Vérifie l'identifiant MongoDB.
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Identifiant restaurant invalide' });
        }
        // Charge le restaurant demandé.
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant introuvable' });
        }
        // Applique le nouveau statut.
        restaurant.status = req.body.status;
        // Sauvegarde le changement.
        await restaurant.save();
        // Construit un message selon le statut choisi.
        const message = req.body.status === 'approved'
            ? 'Restaurant validé'
            : req.body.status === 'suspended'
                ? 'Restaurant suspendu'
                : 'Restaurant remis en attente';
        // Retourne le statut actualisé.
        return res.status(200).json({ message, restaurant });
    } catch (error) {
        // Trace l'erreur serveur.
        console.error('Update restaurant status error:', error);
        // Retourne une erreur générale.
        return res.status(500).json({ message: 'Impossible de modifier le statut du restaurant' });
    }
};
