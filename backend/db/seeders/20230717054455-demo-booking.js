
'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Bookings';
    return queryInterface.bulkInsert(options, [
      {
        userId: 1,
        spotId: 1,
        startDate: '2023-11-19',
        endDate: '2023-11-20'
      },
      {
        userId: 2,
        spotId: 2,
        startDate: '2023-12-19',
        endDate: '2023-12-20'
      },
      {
        userId: 3,
        spotId: 3,
        startDate: '2023-10-19',
        endDate: '2023-10-20'
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      userId: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};
