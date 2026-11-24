const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const safeUser = require('../utils/safeUser');
const isStrongPassword = require('../utils/passwordValidation');
const { escapeRegex, validateRestaurantInput } = require('./restaurantController');

const isValidTelephone = (telephone) => {
    if (typeof telephone !== 'string' || !/^\+?[0-9\s().-]+$/.test(telephone)) {
        return false;
    }
    const digits = telephone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
};

exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, telephone, password, confirmPassword } = req.body;
        const requestedRole = req.body.role === undefined ? 'client' : req.body.role;

        // L'inscription publique ne peut jamais attribuer le role administrateur.
        if (requestedRole === 'admin') {
            return res.status(403).json({ message: 'Le rôle administrateur ne peut pas être attribué lors de l’inscription' });
        }
        if (!['client', 'restaurateur'].includes(requestedRole)) {
            return res.status(400).json({ message: 'Rôle d’inscription invalide' });
        }

        // Valide les informations restaurant avec les memes regles que l'API restaurants.
        let restaurantValidation;
        if (requestedRole === 'restaurateur') {
            const restaurant = req.body.restaurant;
            if (!restaurant || typeof restaurant !== 'object' || Array.isArray(restaurant)) {
                return res.status(400).json({ message: 'Les informations du restaurant sont requises' });
            }
            restaurantValidation = validateRestaurantInput({
                nom: restaurant.nom,
                description: restaurant.description,
                adresse: restaurant.adresse,
                cuisineType: restaurant.cuisineType,
                deliveryFee: 0
            }, true);
            if (restaurantValidation.error) {
                return res.status(400).json({ message: restaurantValidation.error });
            }
        }

        if ([nom, prenom, email, telephone, password, confirmPassword].some((value) => !value) ||
            [nom, prenom, telephone].some((value) => typeof value !== 'string' || !value.trim())) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Format email invalide' });
        }
        if (typeof password !== 'string' || !isStrongPassword(password)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }

        if (requestedRole === 'restaurateur') {
            // Empeche deux comptes de declarer le meme restaurant (nom + adresse).
            const existingRestaurant = await Restaurant.findOne({
                nom: { $regex: `^${escapeRegex(restaurantValidation.updates.nom)}$`, $options: 'i' },
                adresse: { $regex: `^${escapeRegex(restaurantValidation.updates.adresse)}$`, $options: 'i' }
            });
            if (existingRestaurant) {
                return res.status(409).json({ message: 'Ce restaurant est déjà enregistré' });
            }
        }

        let createdUser;
        let creatingRestaurant = false;
        try {
            createdUser = await User.create({
                nom: nom.trim(),
                prenom: prenom.trim(),
                email: normalizedEmail,
                telephone: telephone.trim(),
                password,
                role: requestedRole,
                isActive: true
            });

            let createdRestaurant;
            if (requestedRole === 'restaurateur') {
                creatingRestaurant = true;
                createdRestaurant = await Restaurant.create({
                    ...restaurantValidation.updates,
                    owner: createdUser._id,
                    status: 'pending'
                });
            }

            return res.status(201).json({
                message: requestedRole === 'restaurateur'
                    ? 'Compte restaurateur et restaurant créés avec succès; en attente de validation'
                    : 'Registration successful',
                user: safeUser(createdUser),
                ...(createdRestaurant ? { restaurant: createdRestaurant } : {})
            });
        } catch (createError) {
            // Sans transaction MongoDB, supprime le compte cree si la creation du restaurant echoue.
            if (createdUser) {
                await User.deleteOne({ _id: createdUser._id });
            }
            if (creatingRestaurant && createError && createError.code === 11000) {
                return res.status(409).json({ message: 'Ce restaurant est déjà enregistré' });
            }
            throw createError;
        }
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }
        if (error && error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Erreur serveur inattendue' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Ce compte est désactivé' });
        }

        const passwordMatches = await user.comparePassword(password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: safeUser(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Erreur serveur inattendue' });
    }
};

exports.me = (req, res) => {
    return res.status(200).json({ user: safeUser(req.user) });
};

exports.updateProfile = async (req, res) => {
    const allowedFields = ['nom', 'prenom', 'telephone'];
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ message: 'Données de profil invalides' });
    }

    const unexpectedFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
    if (unexpectedFields.length) {
        return res.status(400).json({ message: 'Seuls le nom, le prénom et le téléphone peuvent être modifiés' });
    }
    if (!Object.keys(body).length) {
        return res.status(400).json({ message: 'Aucune information à modifier' });
    }

    const updates = {};
    for (const field of ['nom', 'prenom']) {
        if (field in body) {
            if (typeof body[field] !== 'string' || !body[field].trim()) {
                return res.status(400).json({ message: `${field} ne peut pas être vide` });
            }
            updates[field] = body[field].trim();
        }
    }
    if ('telephone' in body) {
        if (!isValidTelephone(body.telephone)) {
            return res.status(400).json({ message: 'Format de téléphone invalide' });
        }
        updates.telephone = body.telephone.trim();
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Ce compte est désactivé' });
        }

        Object.assign(user, updates);
        await user.save();
        return res.status(200).json({ message: 'Profil mis à jour', user: safeUser(user) });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error('Profile update error:', error);
        return res.status(500).json({ message: 'Erreur serveur inattendue' });
    }
};

exports.changePassword = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ message: 'Données de mot de passe invalides' });
    }
    if (Object.keys(body).some((field) => !['currentPassword', 'newPassword'].includes(field))) {
        return res.status(400).json({ message: 'Seuls le mot de passe actuel et le nouveau mot de passe sont acceptés' });
    }

    const { currentPassword, newPassword } = body;
    if (typeof currentPassword !== 'string' || !currentPassword ||
        typeof newPassword !== 'string' || !newPassword) {
        return res.status(400).json({ message: 'Les deux mots de passe sont requis' });
    }
    if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
            message: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
        });
    }
    if (newPassword === currentPassword) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent du mot de passe actuel' });
    }

    try {
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: 'Ce compte est désactivé' });
        }
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
        }

        user.password = newPassword;
        await user.save();
        return res.status(200).json({ message: 'Mot de passe mis à jour' });
    } catch (error) {
        console.error('Password change error:', error);
        return res.status(500).json({ message: 'Erreur serveur inattendue' });
    }
};
