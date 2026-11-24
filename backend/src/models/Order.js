// Charge Mongoose pour declarer le document Order.
const mongoose = require('mongoose');

// Cycle de vie d'une commande (partage avec l'etudiant 5).
const ORDER_STATUSES = ['en_attente', 'acceptee', 'en_preparation', 'en_livraison', 'livree', 'annulee'];

// Ligne de commande : le nom et le prix du plat sont copies au moment de l'achat.
const orderItemSchema = new mongoose.Schema({
    plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
    nom: { type: String, required: true, trim: true },
    quantite: {
        type: Number,
        required: true,
        min: [1, 'La quantité doit être supérieure ou égale à 1'],
        validate: { validator: Number.isInteger, message: 'La quantité doit être un entier' }
    },
    prixUnitaire: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    articles: {
        type: [orderItemSchema],
        validate: {
            validator: (articles) => Array.isArray(articles) && articles.length > 0,
            message: 'Une commande doit contenir au moins un article'
        }
    },
    adresseLivraison: {
        type: String,
        required: [true, "L'adresse de livraison est requise"],
        trim: true,
        maxlength: [300, "L'adresse ne doit pas dépasser 300 caractères"]
    },
    remarque: { type: String, default: '', trim: true, maxlength: [500, 'La remarque est trop longue'] },
    sousTotal: { type: Number, required: true, min: 0 },
    fraisLivraison: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    modePaiement: { type: String, enum: ['livraison'], default: 'livraison' },
    statut: { type: String, enum: ORDER_STATUSES, default: 'en_attente' }
}, { timestamps: true });

orderSchema.index({ client: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, statut: 1 });

const Order = mongoose.model('Order', orderSchema);
Order.STATUSES = ORDER_STATUSES;

module.exports = Order;
