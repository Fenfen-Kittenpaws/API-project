const express = require('express');
const { Spot, Review, SpotImage, User, ReviewImage, Booking } = require('../../db/models');
const { restoreUser } = require('../../utils/auth');

const router = express.Router();

// Get all reviews of the current user
router.get('/current', restoreUser, async (req, res) => {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "Authentication required" })
    }

    const reviews = await Review.findAll({
        where: { userId: user.id },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            },
            {
                model: Spot,
                attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price'],
                include: [
                    {
                        model: SpotImage,
                        where: { preview: true },
                        required: false,
                        attributes: ['url']
                    }
                ]
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ],
        attributes: ['id', 'userId', 'spotId', 'review', 'stars', 'createdAt', 'updatedAt']
    });

    const reviewsWithPreviewImage = reviews.map(review => {
        const reviewJSON = review.toJSON();

        if (reviewJSON.Spot.SpotImages.length) {
            reviewJSON.Spot.previewImage = reviewJSON.Spot.SpotImages[0].url
        }

        delete reviewJSON.Spot.SpotImage

        return reviewJSON
    })

    res.json({ Reviews: reviewsWithPreviewImage })
})

module.exports = router;
