// Charge Mongoose pour declarer le document Restaurant.
const mongoose = require('mongoose');

// Definit les champs stockes dans la collection restaurants.
const restaurantSchema = new mongoose.Schema({
    // Enregistre le nom public du restaurant.
    nom: {
        type: String,
        required: [true, 'Le nom du restaurant est requis'],
        trim: true,
        minlength: [2, 'Le nom doit contenir au moins 2 caracteres'],
        maxlength: [120, 'Le nom ne doit pas dépasser 120 caracteres']
    },
    // Enregistre la description commerciale du restaurant.
    description: {
        type: String,
        required: [true, 'La description est requise'],
        trim: true,
        maxlength: [1000, 'La description ne doit pas dépasser 1000 caracteres']
    },
    // Enregistre l'adresse complete utilisee pour la livraison.
    adresse: {
        type: String,
        required: [true, "L'adresse est requise"],
        trim: true,
        maxlength: [300, "L'adresse ne doit pas dépasser 300 caracteres"]
    },
    // Enregistre l'URL de l'image illustrative.
    imageUrl: {
        type: String,
        default: '',
        trim: true,
        maxlength: [1000, "L'URL de l'image ne doit pas dépasser 1000 caracteres"]
    },
    // Enregistre le type de cuisine propose.
    cuisineType: {
        type: String,
        required: [true, 'Le type de cuisine est requis'],
        trim: true,
        maxlength: [80, 'Le type de cuisine ne doit pas dépasser 80 caracteres']
    },
    // Enregistre les horaires d'ouverture sous forme textuelle.
    horaires: {
        type: String,
        default: 'Horaires non renseignes',
        trim: true,
        maxlength: [300, 'Les horaires ne doivent pas dépasser 300 caracteres']
    },
    // Indique si le restaurant accepte actuellement les commandes.
    isOpen: {
        type: Boolean,
        default: true
    },
    // Definit les frais de livraison en dinars tunisiens.
    deliveryFee: {
        type: Number,
        required: [true, 'Les frais de livraison sont requis'],
        min: [0, 'Les frais de livraison ne peuvent pas etre négatifs'],
        max: [1000, 'Les frais de livraison sont trop élevés'],
        default: 0
    },
    // Indique la validation administrative du restaurant.
    status: {
        type: String,
        enum: ['pending', 'approved', 'suspended'],
        default: 'pending'
    },
    // Indique si le restaurant doit etre mis en avant sur la page d'accueil.
    isFeatured: {
        type: Boolean,
        default: false
    },
    // Relie le restaurant au compte restaurateur proprietaire.
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Le proprietaire est requis']
    }
}, {
    // Ajoute automatiquement createdAt et updatedAt.
    timestamps: true
});

// Cree les index utiles pour les recherches frequentes.
restaurantSchema.index({ nom: 'text', description: 'text', cuisineType: 'text' });
restaurantSchema.index({ status: 1, isOpen: 1, isFeatured: -1 });

// Exporte le modele pour les controleurs et les routes.
module.exports = mongoose.model('Restaurant', restaurantSchema);
