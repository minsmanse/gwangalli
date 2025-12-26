const express = require('express');
const router = express.Router();
const { Ingredient, Menu, Order } = require('../models/BarModels');

module.exports = (io) => {
    // Ingredients API
    router.get('/ingredients', async (req, res) => {
        try {
            const ingredients = await Ingredient.findAll();
            res.json(ingredients);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    router.post('/ingredients', async (req, res) => {
        try {
            // Map fields to match model (frontend might send imageUrl, model expects image)
            const { name, abv, image, imageUrl } = req.body;
            const newIngredient = await Ingredient.create({
                name,
                abv,
                image: image || imageUrl // Supporting both field names
            });
            res.status(201).json(newIngredient);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    });

    router.delete('/ingredients/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await Ingredient.destroy({ where: { id } });
            if (!result) {
                return res.status(404).json({ message: 'Ingredient not found' });
            }
            res.json({ message: 'Ingredient deleted' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // Menu API
    router.get('/menu', async (req, res) => {
        try {
            const menu = await Menu.findAll();
            // If we stored data in a JSON column 'data', we might want to unwrap it or just return as is?
            // Mongoose strict:false meant properties were top level.
            // If we use a JSON column, we need to adapt.
            // Let's assume we defined specific columns in Menu model OR we rely on JSON.
            // For simplicity in migration without knowing exact schema, let's just return what we have.
            // If the frontend expects specific fields, we might need to adjust the Model.
            // *Correction*: In the Model, I added `data: JSON`. If the frontend sends `{ name: "Gin", price: 10 }`,
            // we should probably store that in `data`.
            // OR, better, let's allow dynamic fields by just stringifying validation? No.
            // Let's inspect what the frontend sends.
            // AdminMenuBuilder sends `menuData` which has `name`, `glassType`, `ingredients`, `abv`, etc.
            // So I should probably define these columns or use a big JSON object.
            // Let's use `data` column for everything except ID and timestamps to be safe and mimicking Mongoose 'strict: false'.

            // Wait, if I use `data` column, the frontend receives `{ id: 1, data: { name: "...", ... } }`.
            // The frontend expects `{ id: 1, name: "...", ... }`.
            // So I should map it before sending.
            const formattedMenu = menu.map(m => ({ id: m.id, ...m.data, createdAt: m.createdAt }));
            res.json(formattedMenu);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    router.post('/menu', async (req, res) => {
        try {
            // Extract name (required by model) and store full object in data
            const { name } = req.body;
            const newMenu = await Menu.create({
                name: name || 'Untitled',
                data: req.body
            });
            // Return flattened structure
            res.status(201).json({ id: newMenu.id, ...newMenu.data });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    });

    router.delete('/menu/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await Menu.destroy({ where: { id } });
            if (!result) {
                return res.status(404).json({ message: 'Menu item not found' });
            }
            res.json({ message: 'Menu item deleted' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    router.put('/menu/reorder', async (req, res) => {
        try {
            const { menu } = req.body;
            if (!Array.isArray(menu)) {
                return res.status(400).json({ message: 'Invalid data: menu must be an array' });
            }

            // Transactional replace
            // Sequelize doesn't have `insertMany` quite like Mongoose for generic JSON replacement without model definition
            // But we can destroy all and create all.
            await Menu.destroy({ truncate: true });

            // Create all
            // We need to map the input array to match model structure { name, data }
            const itemsToCreate = menu.map(item => ({
                name: item.name || 'Untitled',
                data: item
            }));

            await Menu.bulkCreate(itemsToCreate);

            res.json({ message: 'Menu reordered successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // Orders API
    router.get('/orders', async (req, res) => {
        try {
            const orders = await Order.findAll();
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    router.post('/orders', async (req, res) => {
        try {
            const { items, userName, requestMessage } = req.body;
            const newOrder = await Order.create({
                items,
                userName,
                requestMessage,
                status: 'pending'
            });
            io.emit('newOrder', newOrder);
            res.status(201).json(newOrder);
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    });

    router.put('/orders/:id/status', async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            order.status = status;
            await order.save();

            io.emit('orderUpdated', order);
            res.json(order);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    return router;
};
