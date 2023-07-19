const express = require('express');
const { Spot, Review, SpotImage, User, ReviewImage, Booking } = require('../../db/models');
const { restoreUser } = require('../../utils/auth');
const { Op } = require('sequelize');

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

    if (!user) {
        return res.status(401).json({ message: "Authentication required" })
    }

    const validationErrors = {};
    if (!address) validationErrors.address = 'Street address is required'
    if (!city) validationErrors.city = 'City is required'
    if (!state) validationErrors.state = 'State is required'
    if (!country) validationErrors.country = 'Country is required'
    if (!lat || isNaN(lat) || lat < -90 || lat > 90) validationErrors.lat = 'Latitude is not valid'
    if (!lng || isNaN(lng) || lng < -180 || lng > 180) validationErrors.lng = 'Longitude is not valid'
    if (!name || name.length > 50) validationErrors.name = 'Name must be less than 50 characters'
    if (!description) validationErrors.descrition = 'Description is required'
    if (!price || isNaN(price)) validationErrors.price = 'Price per day is required'

    if (Object.keys(validationErrors).length) {
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

    if (!user) {
        return res.status(401).json({ message: "Authentication required" })
    }

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

    if (!user) {
        return res.status(401).json({ message: "Authentication required" })
    }

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
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    if (!user) {
        return res.status(401).json({ message: "Authentication required" })
    }

    const spot = await Spot.findOne({ where: { id } })

    if (!spot) {
        return res.status(404).json({ message: "Spot could not be found" })
    }

    if (spot.ownerId !== user.id) {
        res.status(403).json({ message: "Forbidden" })
    }

    const validationErrors = {};
    if (!address) validationErrors.address = 'Street address is required'
    if (!city) validationErrors.city = 'City is required'
    if (!state) validationErrors.state = 'State is required'
    if (!country) validationErrors.country = 'Country is required'
    if (!lat || isNaN(lat)) validationErrors.lat = 'Latitude is not valid'
    if (!lng || isNaN(lng)) validationErrors.lng = 'Longitude is not valid'
    if (!name || name.length > 50) validationErrors.name = 'Name must be less than 50 characters'
    if (!description) validationErrors.descrition = 'Description is required'
    if (!price || isNaN(price)) validationErrors.price = 'Price per day is required'

    if (Object.keys(validationErrors).length) {
        return res.status(400).json({
            message: 'Bad Request',
            errors: validationErrors
        });
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

    if (!user) {
        return res.status(401).json({ message: "Authentication required" })
    }

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
router.post('/:id/reviews', restoreUser, async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const { review, stars } = req.body;

    if (!user) {
        return res.status(401).json({ message: "Authentication required" })
    }

    const validationErrors = {};
    if (!review) validationErrors.review = 'Review text is required'
    if (!stars || isNaN(stars) || stars < 1 || stars > 5) validationErrors.stars =  'Stars must be an integer from 1 to 5'

    if (Object.keys(validationErrors).length) {
        return res.status(400).json({
            message: 'Bad Request',
            errors: validationErrors
        });
    }

    const spot = await Spot.findByPk(id);
    if (!spot) {
        return res.status(404).json({ message: 'Spot could not be found' })
    }

    const existingReview = await Review.findOne({
        where: {
            spotId: id,
            userId: user.id
        }
    });

    if (existingReview) {
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

//Get all reviews by a spot's id
router.get('/:id/reviews', async (req, res) => {

    const spotId = req.params.id;

    const spot = await Spot.findByPk(spotId);

    if (!spot) {
        return res.status(404).json({ message: 'Spot could not be found' })
    }

    const reviews = await Review.findAll({
        where: { spotId },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ]
    })

    return res.json({ Reviews: reviews })

})

//Create a Booking from a Spot based on the Spot's id
router.post('/:id/bookings', restoreUser, async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const { startDate, endDate } = req.body

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const spot = await Spot.findByPk(id);

    if (!spot) {
        return res.status(404).json({ message: 'Spot could not be found' })
    }

    if (spot.ownerId === user.id) {
        return res.status(403).json({ message: 'You cannot book your own spot' })
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
            message: "Bad Request",
            errors: {
                endDate: "endDate cannot be on or before startDate",
            },
        })
    }

    if (new Date(startDate) < new Date() || new Date(endDate) < new Date()) {
        return res.status(400).json({
            message: "Bad Request",
            errors: {
                startDate: "startDate cannot be in the past",
                endDate: "endDate cannot be in the past",
            },
        })
    }

    const booked = await Booking.findOne({
        where: {
            spotId: id,
            startDate: {
                [Op.lte]: endDate
            },
            endDate: {
                [Op.gte]: startDate
            }
        }
    })

    if (booked) {
        return res.status(403).json({
            message: "Sorry, this spot is already booked for the specified dates",
            errors: {
                startDate: "Start date conflicts with an existing booking",
                endDate: "End date conflicts with an existing booking"
            }
        })
    }

    const newBooking = await Booking.create({
        spotId: spot.id,
        userId: user.id,
        startDate,
        endDate
    })

    return res.json(newBooking)

})

//Get all Bookings for a Spot based on the Spot's id
router.get('/:id/bookings', restoreUser, async (req, res) => {
    const { user } = req
    const { id } = req.params

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const spot = await Spot.findByPk(id);

    if (!spot) {
        return res.status(404).json({ message: 'Spot could not be found' })
    }

    const bookings = await Booking.findAll({
        where: { spotId: id },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            }
        ],
        attributes: ['id', 'userId', 'spotId', 'startDate', 'endDate', 'createdAt', 'updatedAt']
    })

    const bookingsJSON = bookings.map(booking => {
        const bookingData = booking.toJSON()

        if (spot.ownerId !== user.id) {
            return {
                spotId: bookingData.spotId,
                startDate: bookingData.startDate,
                endDate: bookingData.endDate
            }
        } else {
            return {
                User: bookingData.User,
                id: bookingData.id,
                spotId: bookingData.spotId,
                userId: bookingData.userId,
                startDate: bookingData.startDate,
                endDate: bookingData.endDate,
                createdAt: bookingData.createdAt,
                updatedAt: bookingData.updatedAt
            }
        }
    })

    return res.json({ Bookings: bookingsJSON });
})


module.exports = router;
