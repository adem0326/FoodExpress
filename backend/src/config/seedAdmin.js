const User = require('../models/User');

async function seedAdmin() {
    const existingAdmin = await User.findOne({ role: 'admin' }).select('_id');
    if (existingAdmin) {
        console.log('Admin account already exists; skipping seed');
        return;
    }

    const requiredVariables = ['ADMIN_NAME', 'ADMIN_LASTNAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
    const missingVariables = requiredVariables.filter((name) => !process.env[name]);
    if (missingVariables.length) {
        throw new Error(`Missing admin seeder environment variables: ${missingVariables.join(', ')}`);
    }

    try {
        await User.create({
            prenom: process.env.ADMIN_NAME.trim(),
            nom: process.env.ADMIN_LASTNAME.trim(),
            email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
            telephone: '00000000',
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
            isActive: true
        });
        console.log('Admin account created successfully');
    } catch (error) {
        if (error.code === 11000) {
            const adminCreatedConcurrently = await User.findOne({ role: 'admin' }).select('_id');
            if (adminCreatedConcurrently) {
                console.log('Admin account already exists; skipping seed');
                return;
            }
        }
        throw error;
    }
}

module.exports = seedAdmin;
