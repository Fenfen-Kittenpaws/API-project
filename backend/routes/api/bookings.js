const express = require('express');
const { Spot, Review, SpotImage, User, ReviewImage, Booking } = require('../../db/models');
const { restoreUser } = require('../../utils/auth');
const spot = require('../../db/models/spot');

const router = express.Router();

//Get all of the current user's bookings
router.get('/current', restoreUser, async (req, res) => {
    const { user } = req

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' })
    }

    const bookings = await Booking.findAll({
        where: { userId: user.id },
        include: [
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
            }
        ],
        attributes: ['id', 'spotId', 'userId', 'startDate', 'endDate', 'createdAt', 'updatedAt']
    })

    const data = bookings.map(booking => {
        const spot = booking.Spot.get({ plain: true });
        if (spot.SpotImages.length) {
            spot.previewImage = spot.SpotImages[0].url;
            delete spot.SpotImages;
        }

        return {
            id: booking.id,
            spotId: booking.spotId,
            Spot: spot,
            userId: booking.userId,
            startDate: booking.startDate,
            endDate: booking.endDate,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        };
    });

    res.json({ Bookings: data });
})


module.exports = router;
