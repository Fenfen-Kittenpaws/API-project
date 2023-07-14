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


// create a spot
router.post('/', restoreUser, async (req, res) => {
    const { user } = req;
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    const validationErrors = [];
    if (!address) validationErrors.push({ field: 'address', message: 'Street address is required' });
    if (!city) validationErrors.push({ field: 'city', message: 'City is required' });
    if (!state) validationErrors.push({ field: 'state', message: 'State is required' });
    if (!country) validationErrors.push({ field: 'country', message: 'Country is required' });
    if (!lat || isNaN(lat)) validationErrors.push({ field: 'lat', message: 'Latitude is not valid' });
    if (!lng || isNaN(lng)) validationErrors.push({ field: 'lng', message: 'Longitude is not valid' });
    if (!name || name.length > 50) validationErrors.push({ field: 'name', message: 'Name must be less than 50 characters' });
    if (!description) validationErrors.push({ field: 'description', message: 'Description is required' });
    if (!price || isNaN(price)) validationErrors.push({ field: 'price', message: 'Price per day is required' });

    if (validationErrors.length) {
        return res.status(400).json({
            message: 'Bad Request',
            errors: validationErrors
        });
    }


    const newSpot = await Spot.create({
        ownerId: user.id,
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price
    });

    return res.json(newSpot);
});

// get all spots owned by current user
router.get('/current', restoreUser, async (req, res) => {
    const { user } = req;


    const spots = await Spot.findAll({
        where: { ownerId: user.id },
        include: [
            {
                model: Review,
                attributes: ['stars'],
            },
            {
                model: SpotImage,
                where: { preview: true },
                required: false,
                attributes: ['url'],
            }
        ],
        attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt']
    });

    const spotsWithAvgRatingAndPreview = spots.map(spot => {
        const spotJSON = spot.toJSON();

        // calculate avgRating
        if (spotJSON.Reviews.length) {
            const avgRating = spotJSON.Reviews.reduce((acc, review) => acc + review.stars, 0) / spotJSON.Reviews.length;
            spotJSON.avgRating = avgRating;
        }

        // add preview image
        if (spotJSON.SpotImages.length) {
            spotJSON.previewImage = spotJSON.SpotImages[0].url;
        }

        delete spotJSON.Reviews;
        delete spotJSON.SpotImages;

        return spotJSON;
    });

    return res.json({ Spots: spotsWithAvgRatingAndPreview });

});

module.exports = router;