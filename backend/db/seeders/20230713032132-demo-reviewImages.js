
'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'ReviewImages';
    return queryInterface.bulkInsert(options, [
      {
        reviewId: 1,
        url: 'https://res.cloudinary.com/dxagb2mui/image/upload/v1689218124/houseA_wog8pm.jpg'
      },
      {
        reviewId: 2,
        url: 'https://res.cloudinary.com/dxagb2mui/image/upload/v1689218139/houseB_fat7lc.jpg'
      },
      {
        reviewId: 3,
        url: 'https://res.cloudinary.com/dxagb2mui/image/upload/v1689218148/houseC_cejfuu.jpg'
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'ReviewImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      reviewId: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};
