const express = require('express');
const { Review, ReviewImage } = require('../../db/models');
const { restoreUser } = require('../../utils/auth');


const router = express.Router();

router.delete('/:id', restoreUser, async (req, res) => {
    const { user } = req
    const { id } = req.params

    if (!user) {
        return res.status(401).json({ message: 'Authentication required' })
    }

    const reviewImage = await ReviewImage.findByPk(id, {
        include: {
            model: Review,
            attributes: ['userId']
        }
    })

    if (!reviewImage) {
        return res.status(404).json({ message: 'Review Image could not be found' })
    }

    if (reviewImage.Review.userId !== user.id) {
        return res.status(403).json({ message: 'Forbidden' })
    }

    await reviewImage.destroy()

    return res.json({ message: 'Successfully deleted' })

})

//extra, I wanted to see all the review images
router.get('/', async (req, res) => {
    const reviewImages = await ReviewImage.findAll({
        attributes: ['id', 'url', 'reviewId']
    });

    return res.json({ reviewImages })
});


module.exports = router;
