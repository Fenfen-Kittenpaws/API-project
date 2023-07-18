const express = require('express');
const { Spot, Review, SpotImage, User, ReviewImage } = require('../../db/models');
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

//Add an Image to a Review based on the Review's id
router.post('/:id/images', restoreUser, async (req, res) => {
    const { user } = req
    const { id } = req.params
    const { url } = req.body

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' })
    }

    const review = await Review.findByPk(id)

    if (!review) {
        return res.status(404).json({ message: 'Review could not be found' })
    }

    if (review.userId !== user.id) {
        res.status(403).json({ message: "Forbidden" })
    }

    const reviewImages = await ReviewImage.findAll({ where: { reviewId: id } })

    if (reviewImages.length >= 10) {
        return res.status(403).json({ message: 'Maximum number of images for this resource was reached' })
    }

    const newImage = await ReviewImage.create({
        reviewId: id,
        url
    })

    const reviewImageData = {
        id: newImage.id,
        url: newImage.url
    }

    return res.json(reviewImageData)
})

//Edit a review
router.put('/:id', restoreUser, async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const { review, stars } = req.body;

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const validationErrors = {};
    if (!review) validationErrors.review = 'Review text is required'
    if (!stars || isNaN(stars) || stars < 1 || stars > 5) validationErrors.stars = 'Stars must be an integer from 1 to 5'

    if (Object.keys(validationErrors).length) {
        return res.status(400).json({
            message: 'Bad Request',
            errors: validationErrors
        });
    }

    const reviewExists = await Review.findByPk(id)

    if (!reviewExists) {
        return res.status(404).json({ message: 'Review could not be found' })
    }

    if (reviewExists.userId !== user.id) {
        res.status(403).json({ message: "Forbidden" })
    }

    await reviewExists.update({ review, stars })

    return res.json(reviewExists)
})

//Delete a review
router.delete('/:id', restoreUser, async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const reviewExists = await Review.findByPk(id)

    if (!reviewExists) {
        return res.status(404).json({ message: 'Review could not be found' })
    }

    if (reviewExists.userId !== user.id) {
        res.status(403).json({ message: "Forbidden" })
    }

    await reviewExists.destroy()

    return res.json({ message: 'Successfully deleted' })

})

module.exports = router;
