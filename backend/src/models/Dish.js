const mongoose = require('mongoose');
const dishCategories = require('../utils/dishCategories');

const dishSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom du plat est requis'],
        trim: true,
        minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
        maxlength: [120, 'Le nom ne doit pas dépasser 120 caractères']
    },
    imageUrl: {
        type: String,
        default: '',
        trim: true,
        maxlength: [1000, "L'URL de l'image ne doit pas dépasser 1000 caractères"]
    },
    description: {
        type: String,
        required: [true, 'La description est requise'],
        trim: true,
        maxlength: [1000, 'La description ne doit pas dépasser 1000 caractères']
    },
    prix: {
        type: Number,
        required: [true, 'Le prix est requis'],
        min: [0, 'Le prix ne peut pas être négatif'],
        max: [100000, 'Le prix est trop élevé']
    },
    categorie: {
        type: String,
        required: [true, 'La catégorie est requise'],
        enum: {
            values: dishCategories,
            message: 'Catégorie de plat invalide'
        }
    },
    disponible: {
        type: Boolean,
        default: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Le restaurant est requis']
    }
}, {
    timestamps: true
});

dishSchema.index({ restaurant: 1, categorie: 1, nom: 1 });

module.exports = mongoose.model('Dish', dishSchema);
