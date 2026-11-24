
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const seedAdmin = require('./config/seedAdmin');
const seedRestaurateur = require('./config/seedRestaurateur');

const app = express();

app.use(cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true
}));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/restaurants/:restaurantId/dishes', require('./routes/dishRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
<<<<<<< HEAD
app.use('/api/orders', require('./routes/orderRoutes'));
=======
>>>>>>> 146671c706d033a2e2e8c76bf5828665fe3f4a98

app.get('/', (req, res) => {
    res.json({ message: 'FoodExpress API is running!' });
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodexpress')
    .then(async () => {
        console.log('MongoDB connected successfully');
        await seedAdmin();
        await seedRestaurateur();

        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.error('Backend startup error:', error);
        process.exit(1);
    });
