'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'SpotImages';
    return queryInterface.bulkInsert(options, [
      {
        spotId: 1,
        url: 'https://res.cloudinary.com/dxagb2mui/image/upload/v1689218124/houseA_wog8pm.jpg',
        preview: true
      },
      {
        spotId: 2,
        url: 'https://res.cloudinary.com/dxagb2mui/image/upload/v1689218139/houseB_fat7lc.jpg',
        preview: true
      },
      {
        spotId: 3,
        url: 'https://res.cloudinary.com/dxagb2mui/image/upload/v1689218148/houseC_cejfuu.jpg',
        preview: true
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'SpotImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};
