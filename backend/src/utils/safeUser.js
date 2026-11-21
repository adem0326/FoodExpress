module.exports = (user, includeCreatedAt = false) => {
    const safeUser = {
        id: user._id.toString(),
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        isActive: user.isActive
    };

    if (includeCreatedAt) {
        safeUser.createdAt = user.createdAt;
    }

    return safeUser;
};
