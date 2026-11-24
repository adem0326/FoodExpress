const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nom: { type: String, required: [true, 'Le nom est requis'], trim: true },
    prenom: { type: String, required: [true, 'Le prénom est requis'], trim: true },
    email: {
        type: String,
        required: [true, "L'email est requis"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email invalide']
    },
    telephone: { type: String, required: [true, 'Le téléphone est requis'], trim: true },
    password: { type: String, required: [true, 'Le mot de passe est requis'], select: false },
    role: {
        type: String,
        enum: ['client', 'restaurateur', 'admin'],
        default: 'client'
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
