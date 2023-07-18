const express = require('express');
const { Spot, Review, SpotImage, User, ReviewImage, Booking } = require('../../db/models');
const { restoreUser } = require('../../utils/auth');
const { Op, Sequelize } = require('sequelize');

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

//Edit an existing booking
router.put('/:id', restoreUser, async (req, res) => {
    const { user } = req
    const { id } = req.params
    const { startDate, endDate } = req.body

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' })
    }

    const booking = await Booking.findByPk(id)

    if (!booking) {
        return res.status(404).json({ message: 'Booking could not be found' })
    }

    if (booking.userId !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (new Date(booking.endDate) < new Date()) {
        return res.status(403).json({ message: 'Past booking cannot be modified' })
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
            message: "Bad Request",
            errors: {
                endDate: "endDate cannot come before startDate"
            }
        })
    }

    const booked = await Booking.findOne({
        where: {
            spotId: booking.spotId,
            startDate: { [Op.lte]: endDate },
            endDate: { [Op.gte]: startDate },
            id: { [Op.ne]: booking.id }
        }
    })

    if (booked) {
        return res.status(403).json({
            message: 'Sorry, this spot is already booked for the specified dates',
            errors: {
                startDate: 'Start date conflicts with an existing booking',
                endDate: 'End date conflicts with an existing booking',
            }
        })
    }

    booking.startDate = startDate;
    booking.endDate = endDate;
    await booking.save();

    return res.json({
        id: booking.id,
        spotId: booking.spotId,
        userId: booking.userId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
    })

})

//Delete a Booking
    router.delete('/:id', restoreUser, async(req, res) => {
        const { user } = req
        const { id } = req.params

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const booking = await Booking.findByPk(id, {
            include: {
                model: Spot,
                attributes: ['ownerId']
            }
        })

        if (!booking) {
            return res.status(404).json({ message: 'Booking could not be found' })
        }

        if (booking.userId !== user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if(new Date(booking.startDate) < new Date()){
            return res.status(403).json({ message: 'Bookings that have started cannot be deleted' })
        }

        await booking.destroy()

        return res.json({ message: 'Successfully deleted' })
    })

module.exports = router;
