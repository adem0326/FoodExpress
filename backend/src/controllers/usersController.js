const User = require('../models/User');
const safeUser = require('../utils/safeUser');
const isStrongPassword = require('../utils/passwordValidation');

const roles = ['client', 'restaurateur', 'admin'];
const updateFields = ['nom', 'prenom', 'email', 'telephone', 'role'];

let adminMutationQueue = Promise.resolve();

function serializeAdminMutation(mutation) {
    const result = adminMutationQueue.then(mutation, mutation);
    adminMutationQueue = result.then(() => undefined, () => undefined);
    return result;
}

function isValidTelephone(value) {
    if (typeof value !== 'string' || !/^\+?[0-9\s().-]+$/.test(value.trim())) {
        return false;
    }
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
}

function isValidEmail(value) {
    return typeof value === 'string' &&
        value.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function hasOtherActiveAdmin(userId) {
    return User.exists({
        _id: { $ne: userId },
        role: 'admin',
        isActive: true
    });
}

exports.listUsers = async (req, res) => {
    const allowedQueryKeys = ['search', 'role', 'status', 'page', 'limit'];
    if (Object.keys(req.query).some((key) => !allowedQueryKeys.includes(key))) {
        return res.status(400).json({ message: 'Paramètres de recherche invalides' });
    }

    const parsePositiveInteger = (value, defaultValue, maximum) => {
        if (value === undefined) return defaultValue;
        if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
        const parsed = Number(value);
        return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null;
    };

    const page = parsePositiveInteger(req.query.page, 1, 100000);
    const limit = parsePositiveInteger(req.query.limit, 10, 100);
    const search = req.query.search === undefined ? '' : req.query.search;
    const role = req.query.role === undefined ? 'all' : req.query.role;
    const status = req.query.status === undefined ? 'all' : req.query.status;

    if (page === null || limit === null ||
        typeof search !== 'string' || search.length > 100 ||
        typeof role !== 'string' || !['all', ...roles].includes(role) ||
        typeof status !== 'string' || !['all', 'active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Paramètres de recherche invalides' });
    }

    const filter = {};
    if (search.trim()) {
        const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchExpression = { $regex: escapedSearch, $options: 'i' };
        filter.$or = [
            { nom: searchExpression },
            { prenom: searchExpression },
            { email: searchExpression }
        ];
    }
    if (role !== 'all') filter.role = role;
    if (status !== 'all') filter.isActive = status === 'active';

    try {
        const total = await User.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        const currentPage = totalPages ? Math.min(page, totalPages) : 1;
        const users = await User.find(filter)
            .select('nom prenom email telephone role isActive createdAt')
            .sort({ createdAt: -1, _id: 1 })
            .skip((currentPage - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            users: users.map((user) => safeUser(user, true)),
            pagination: { page: currentPage, limit, total, totalPages }
        });
    } catch (error) {
        console.error('List users error:', error);
        return res.status(500).json({ message: 'Impossible de charger les utilisateurs' });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('nom prenom email telephone role isActive createdAt');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        return res.status(200).json({ user: safeUser(user, true) });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ message: 'Impossible de charger cet utilisateur' });
    }
};

exports.updateUser = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some((field) => !updateFields.includes(field)) ||
        !Object.keys(body).length) {
        return res.status(400).json({ message: 'Données utilisateur invalides' });
    }

    const updates = {};
    for (const field of ['nom', 'prenom']) {
        if (field in body) {
            if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 100) {
                return res.status(400).json({ message: 'Le prénom et le nom doivent contenir entre 1 et 100 caractères' });
            }
            updates[field] = body[field].trim();
        }
    }
    if ('email' in body) {
        if (typeof body.email !== 'string') {
            return res.status(400).json({ message: 'Format email invalide' });
        }
        const email = body.email.trim().toLowerCase();
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Format email invalide' });
        }
        updates.email = email;
    }
    if ('telephone' in body) {
        if (!isValidTelephone(body.telephone)) {
            return res.status(400).json({ message: 'Format de téléphone invalide' });
        }
        updates.telephone = body.telephone.trim();
    }
    if ('role' in body) {
        if (typeof body.role !== 'string' || !roles.includes(body.role)) {
            return res.status(400).json({ message: 'Rôle invalide' });
        }
        updates.role = body.role;
    }

    try {
        return await serializeAdminMutation(async () => {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur introuvable' });
            }

            const isSelf = user._id.equals(req.user._id);
            if (isSelf && updates.role && updates.role !== 'admin') {
                return res.status(403).json({ message: 'Vous ne pouvez pas retirer votre propre rôle administrateur' });
            }
            if (user.role === 'admin' && user.isActive && updates.role && updates.role !== 'admin' &&
                !(await hasOtherActiveAdmin(user._id))) {
                return res.status(409).json({ message: 'Le dernier administrateur actif ne peut pas être rétrogradé' });
            }
            if (updates.email && await User.exists({ email: updates.email, _id: { $ne: user._id } })) {
                return res.status(409).json({ message: 'Cet email est déjà utilisé' });
            }

            Object.assign(user, updates);
            await user.save();
            return res.status(200).json({ message: 'Utilisateur mis à jour', user: safeUser(user, true) });
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error('Update user error:', error);
        return res.status(500).json({ message: 'Impossible de mettre à jour cet utilisateur' });
    }
};

exports.updateUserPassword = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).length !== 2 ||
        typeof body.newPassword !== 'string' || typeof body.confirmPassword !== 'string') {
        return res.status(400).json({ message: 'Un nouveau mot de passe et sa confirmation sont requis' });
    }
    if (body.newPassword !== body.confirmPassword) {
        return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }
    if (!isStrongPassword(body.newPassword)) {
        return res.status(400).json({
            message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
        });
    }

    try {
        return await serializeAdminMutation(async () => {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur introuvable' });
            }

            user.password = body.newPassword;
            await user.save();
            return res.status(200).json({ message: 'Mot de passe utilisateur mis à jour' });
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0].message });
        }
        console.error('Update user password error:', error);
        return res.status(500).json({ message: 'Impossible de modifier le mot de passe utilisateur' });
    }
};

exports.updateUserStatus = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).length !== 1 || typeof body.isActive !== 'boolean') {
        return res.status(400).json({ message: 'Le statut doit être un booléen isActive' });
    }

    try {
        return await serializeAdminMutation(async () => {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur introuvable' });
            }
            if (user._id.equals(req.user._id) && !body.isActive) {
                return res.status(403).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
            }
            if (user.role === 'admin' && user.isActive && !body.isActive &&
                !(await hasOtherActiveAdmin(user._id))) {
                return res.status(409).json({ message: 'Le dernier administrateur actif ne peut pas être désactivé' });
            }

            user.isActive = body.isActive;
            await user.save();
            return res.status(200).json({
                message: body.isActive ? 'Compte activé' : 'Compte désactivé',
                user: safeUser(user, true)
            });
        });
    } catch (error) {
        console.error('Update user status error:', error);
        return res.status(500).json({ message: 'Impossible de modifier le statut de cet utilisateur' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        return await serializeAdminMutation(async () => {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur introuvable' });
            }
            if (user._id.equals(req.user._id)) {
                return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
            }
            if (user.role === 'admin' && user.isActive && !(await hasOtherActiveAdmin(user._id))) {
                return res.status(409).json({ message: 'Le dernier administrateur actif ne peut pas être supprimé' });
            }

            await user.deleteOne();
            return res.status(200).json({ message: 'Utilisateur supprimé' });
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ message: 'Impossible de supprimer cet utilisateur' });
    }
};
