'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  p: async (queryInterface, Sequelize) => {
    options.tableName = 'Spots';
    return queryInterface.bulkInsert(options, [
      {
        address: "123 Fake street",
        city: "Faketown",
        state: "Fakestate",
        country: "Fake USA",
        lat: 37.1234567,
        lng: -122.12345,
        name: "Fake Spot A",
        description: "This is a fake spot with the name of A",
        price: 123
      },
      {
        address: "456 Fake avenue",
        city: "Faketown",
        state: "Fakestate",
        country: "Fake USA",
        lat: 37.7654321,
        lng: -122.54321,
        name: "Fake Spot B",
        description: "This is a fake spot with the name of B",
        price: 321
      },
      {
        address: "789 Fake lane",
        city: "Faketown",
        state: "Fakestate",
        country: "Fake USA",
        lat: 37.7651234,
        lng: -122.32145,
        name: "Fake Spot C",
        description: "This is a fake spot with the name of C",
        price: 231
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ["Fake Spot A", "Fake Spot B", "Fake Spot C"] }
    }, {});
  }
};
