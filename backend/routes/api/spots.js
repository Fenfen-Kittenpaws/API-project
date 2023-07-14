const express = require('express');
const { Spot, Review, SpotImage } = require('../../db/models');
const { restoreUser, requireAuth } = require('../../utils/auth');
const { Op, Sequelize } = require('sequelize');

const router = express.Router();

// get all spots
router.get('/', async (req, res) => {
    const spots = await Spot.findAll();

    return res.json(spots);
});




module.exports = router;
