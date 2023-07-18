// backend/routes/api/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize')

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email.'),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.'),
  check('username')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage('First Name is required.'),
  check('lastName')
    .exists({ checkFalsy: true })
    .withMessage('Last Name is required.')
];

function isEmail(email) {
  const res = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return res.test(String(email).toLowerCase());
}

// Sign up
router.post(
  '/',
  validateSignup,
  async (req, res) => {
    const { firstName, lastName, email, password, username } = req.body;


    const userWithSameEmail = await User.findOne({ where: { email } })

    if (userWithSameEmail) {
      return res.status(500).json({
        message: "User already exists",
        errors: { email: "User with that email already exists" }
      })
    }

    const userWithSameUsername = await User.findOne({ where: { username } })

    if (userWithSameUsername) {
      return res.status(500).json({
        message: "User already exists",
        errors: { username: "User with that username already exists" }
      });
    }

    const validationErrors = {}
    if (!email || !isEmail(email)) validationErrors.email = 'Invalid email'
    if (!username) validationErrors.username = 'Username is required'
    if (!firstName) validationErrors.firstName = 'First Name is required'
    if (!lastName) validationErrors.lastName = 'Last Name is required'

    if (Object.keys(validationErrors).length) {
      return res.status(400).json({
          message: 'Bad Request',
          errors: validationErrors
      });
    }

    const saltRounds = 10
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    const user = await User.create({ firstName, lastName, email, username, password: hashedPassword });

    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    await setTokenCookie(res, safeUser);

    return res.json({
      user: safeUser
    });
  }
);

module.exports = router;
