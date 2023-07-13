const express = require('express');
const { Spot } = require('../db/models');
const { restoreUser } = require('../../utils/auth');

const router = express.Router();

// get all spots
router.get('/', (async (req, res) => {
    const spots = await Spot.findAll();
    return res.json(spots);
}));

//get all spots owned by current user


module.exports = router;
