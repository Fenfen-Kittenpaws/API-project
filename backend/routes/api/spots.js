const express = require('express');
const { Spot, Review, SpotImage, User } = require('../../db/models');
const { restoreUser, requireAuth } = require('../../utils/auth');
const { Op, Sequelize } = require('sequelize');

const router = express.Router();

// get all spots
router.get('/', async (req, res) => {
    const spots = await Spot.findAll({
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
        //console.log(spotJSON)

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

//get details for a spot from an id
router.get('/:id', async (req, res) => {
    const { id } = req.params

    const spot = await Spot.findOne({
        where: { id },
        include: [
            {
                model: SpotImage,
                as: 'SpotImages',
                attributes: ['id', 'url', 'preview']
            },
            {
                model: User,
                as: 'Owner',
                attributes: ['id', 'firstName', 'lastName']
            },
            {
                model: Review,
                as: 'Reviews'
            }
        ]

    })

    if (!spot) {
        return res.status(404).json({ message: 'Spot could not be found' })
    }

    const spotJSON = spot.toJSON()

    const numReviews = spotJSON.Reviews.length
    const avgStarRating = spotJSON.Reviews.reduce((total, review) => total + review.stars, 0) / numReviews

    delete spotJSON.Reviews

    spotJSON.numReviews = numReviews
    spotJSON.avgStarRating = avgStarRating

    const spotData = {
        id: spot.id,
        ownerId: spot.ownerId,
        address: spot.address,
        city: spot.city,
        state: spot.state,
        country: spot.country,
        lat: spot.lat,
        lng: spot.lng,
        name: spot.name,
        description: spot.description,
        price: spot.price,
        createdAt: spot.createdAt,
        updatedAt: spot.updatedAt,
        numReviews,
        avgStarRating,
        SpotImages: spot.SpotImages,
        Owner: spot.Owner
    };

    return res.json(spotData)

})


// Add image to a spot
router.post('/:id/images', restoreUser, async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const { url, preview } = req.body;

    const spot = await Spot.findOne({ where: { id } });
    if (!spot) {
        return res.status(404).json({ message: 'Spot could not found' });
    }

    if (spot.ownerId !== user.id) {
        res.status(403).json({ message: "Forbidden" })
    }


    const newImage = await SpotImage.create({
        spotId: id,
        url,
        preview
    });

    return res.json({
        id: newImage.id,
        url: newImage.url,
        preview: newImage.preview
    });

});

//edit a spot
router.put('/:id', restoreUser, async (req, res) => {
    const { user } = req
    const { id } = req.params
    const { address, city, state, country, lat, lng, name, description, price } = req.body

    const spot = await Spot.findOne({ where: { id } })

    if (!spot) {
        return res.status(404).json({ message: "Spot could not be found" })
    }

    if (spot.ownerId !== user.id) {
        res.status(403).json({ message: "Forbidden" })
    }


    await spot.update({
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price
    })

    return res.json(spot)

})

//delete a spot
router.delete('/:id', restoreUser, async (req, res) => {
    const { user } = req
    const { id } = req.params

    const spot = await Spot.findOne({ where: { id } })

    if (!spot) {
        return res.status(404).json({ message: "Spot could not be found" })
    }

    if (spot.ownerId !== user.id) {
        res.status(403).json({ message: "Forbidden" })
    }

    await spot.destroy()

    return res.json({ message: "Successfully deleted" })
})

//create a review for a spot based on the spot's id
router.post('/:id/reviews', restoreUser, async(req, res) => {
    const { user } = req;
    const { id } = req.params;
    const { review, stars } = req.body;

    const validationErrors = [];
    if (!review) validationErrors.push({ field: 'review', message: 'Review text is required' });
    if (!stars || isNaN(stars) || stars < 1 || stars >5 ) validationErrors.push({ field: 'stars', message: 'Stars must be an integer from 1 to 5' });

    if (validationErrors.length) {
        return res.status(400).json({
            message: 'Bad Request',
            errors: validationErrors
        });
    }

    const spot = await Spot.findByPk(id);
    if(!spot){
        return res.status(404).json({ message: 'Spot could not be found' })
    }

    const existingReview = await Review.findOne({
        where: {
            spotId: id,
            userId: user.id
        }
    });

    if(existingReview){
        return res.status(500).json({ message: 'User already has a review for this spot' })
    }

    const newReview = await Review.create({
        userId: user.id,
        spotId: id,
        review,
        stars
    });

    return res.json(newReview)

})


module.exports = router;
