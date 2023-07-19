'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Booking.belongsTo(models.Spot, { foreignKey: 'spotId'});
      Booking.belongsTo(models.User, { foreignKey: 'userId'})
    }
  }
  Booking.init({
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isFutureDate(value) {
          if (new Date(value) < new Date()) {
            throw new Error('startDate must be in the future');
          }
        }
      }
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterStartDate(value) {
          if (this.startDate && value < this.startDate) {
            throw new Error('endDate must be after startDate');
          }
        },
        isFutureDate(value) {
          if (new Date(value) < new Date()) {
            throw new Error('endDate must be in the future');
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};
