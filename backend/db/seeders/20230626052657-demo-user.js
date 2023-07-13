'use strict';
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    return queryInterface.bulkInsert(options, [
      {
        firstName: 'Afake',
        lastName: 'Afalso',
        email: 'demo@user.io',
        username: 'Demo-lition',
        password: bcrypt.hashSync('qwertyu1')
      },
      {
        firstName: 'Bfake',
        lastName: 'Bfalso',
        email: 'user1@user.io',
        username: 'FakeUser1',
        password: bcrypt.hashSync('asdfghj2')
      },
      {
        firstName: 'Cfake',
        lastName: 'Cfalso',
        email: 'user2@user.io',
        username: 'FakeUser2',
        password: bcrypt.hashSync('zxcvbnm3')
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['Demo-lition', 'FakeUser1', 'FakeUser2'] }
    }, {});
  }
};
