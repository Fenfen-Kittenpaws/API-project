const express = require('express');
const { Spot, SpotImage } = require('../../db/models');
const { restoreUser } = require('../../utils/auth');


const router = express.Router();

router.delete('/:id', restoreUser, async (req, res) => {
    const { user } = req
    const { id } = req.params

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' })
    }

    const spotImage = await SpotImage.findByPk(id, {
        include: {
            model: Spot,
            attributes: ['ownerId']
        }
    })

    if (!spotImage) {
        return res.status(404).json({ message: "Spot image could not be found" })
    }

    if (spotImage.Spot.ownerId !== user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    await spotImage.destroy()

    return res.json({ message: 'Successfully deleted' })
})


module.exports = router;
