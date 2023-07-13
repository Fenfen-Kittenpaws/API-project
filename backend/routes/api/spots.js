const express = require('express');
const { Spot, Review, SpotImage } = require('../../db/models');
const { restoreUser } = require('../../utils/auth');

const router = express.Router();

// get all spots
router.get('/', (async (req, res) => {
    const spots = await Spot.findAll({
        include: [
            {
                model: Review,
                attributes: ['id', 'stars'], // Add any other Review attributes you need.
            },
            {
                model: SpotImage,
                attributes: ['id', 'url'], // Add any other SpotImage attributes you need.
            }
        ]
    });
    return res.json(spots);
}));

//get all spots owned by current user


module.exports = router;
