const express = require('express');

const router = express.Router();

// Mount all route modules here
const authRoutes = require('./auth');
const menuRoutes = require('./menu');
const orderRoutes = require('./orders');
const kitchenRoutes = require('./kitchen');
const recipeRoutes = require('./recipes');
const reportRoutes = require('./reports');
const inventoryRoutes = require('./inventory');
const userRoutes = require('./users');

router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/recipes', recipeRoutes);
router.use('/reports', reportRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/users', userRoutes);

// Future routes will be added here:
// router.use('/customers', customerRoutes);

module.exports = router;
