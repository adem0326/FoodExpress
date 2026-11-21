const User = require('../models/User');

async function seedRestaurateur() {
    const requiredVariables = [
        'RESTAURATEUR_NAME',
        'RESTAURATEUR_LASTNAME',
        'RESTAURATEUR_EMAIL',
        'RESTAURATEUR_PASSWORD'
    ];
    const missingVariables = requiredVariables.filter((name) => !process.env[name]);
    if (missingVariables.length) {
        throw new Error(`Missing restaurateur seeder environment variables: ${missingVariables.join(', ')}`);
    }

    const email = process.env.RESTAURATEUR_EMAIL.trim().toLowerCase();
    const existingAccount = await User.findOne({ email }).select('_id');
    if (existingAccount) {
        console.log('Restaurateur account already exists; skipping seed');
        return;
    }

    try {
        await User.create({
            prenom: process.env.RESTAURATEUR_NAME.trim(),
            nom: process.env.RESTAURATEUR_LASTNAME.trim(),
            email,
            telephone: '00000000',
            password: process.env.RESTAURATEUR_PASSWORD,
            role: 'restaurateur',
            isActive: true
        });
        console.log('Restaurateur account created successfully');
    } catch (error) {
        if (error.code === 11000) {
            const accountCreatedConcurrently = await User.findOne({ email }).select('_id');
            if (accountCreatedConcurrently) {
                console.log('Restaurateur account already exists; skipping seed');
                return;
            }
        }
        throw error;
    }
}

module.exports = seedRestaurateur;
