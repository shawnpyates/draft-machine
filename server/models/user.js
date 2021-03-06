module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  User.associate = (models) => {
    User.belongsToMany(models.Draft, {
      through: 'userDraft',
      foreignKey: 'userId',
    });
    User.belongsToMany(models.Team, {
      through: 'userTeam',
      foreignKey: 'userId',
    });
    User.hasMany(models.Draft, {
      foreignKey: 'ownerUserId',
    });
    User.hasMany(models.Team, {
      foreignKey: 'ownerUserId',
    });
    User.hasMany(models.Request, {
      foreignKey: 'requestCreatorId',
    });
  };
  return User;
};
