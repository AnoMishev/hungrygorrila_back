const express = require('express');
const { getAllFood, getFoodById, getFoodByTag, getAllTags } = require('../food-service');
const verifyToken = require('../middlewares/verifytoken')
const router = express.Router();
router.use(verifyToken); // prvo proveruva token!

// Get all tags
router.get('/tags', (req, res) => {
    getAllTags((err, tags) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(tags);
    });
});

// Get all food items
router.get('/', (req, res) => {
    getAllFood((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get food by ID
router.get('/:id', (req, res) => {
    const id = req.params.id;

    getFoodById(id, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Food not found' });
        res.json(row);
    });
});

// Get food by tag
router.get('/tag/:tag', (req, res) => {
    const tag = req.params.tag;

    getFoodByTag(tag, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
