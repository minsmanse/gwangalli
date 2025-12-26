const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'), // Store DB in server root
    logging: false // Disable logging for cleaner output
});

const Ingredient = sequelize.define('Ingredient', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    abv: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true // Adds createdAt, updatedAt
});

const Menu = sequelize.define('Menu', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Add other fields as needed based on usage
    // The original Mongoose schema was strict: false, so it could have anything.
    // We might need to use JSON type for flexibility if we don't know the schema
    // But SQLite JSON support depends on version. 
    // Let's assume basic fields for now, or use a JSON field if available.
    // For 'reorder', we need an order/index field? Use 'id' for now.
    data: {
        type: DataTypes.JSON, // Use JSON column to store flexible data like Mongoose
        allowNull: true
    }
}, {
    timestamps: true
});

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    userName: {
        type: DataTypes.STRING
    },
    requestMessage: {
        type: DataTypes.STRING
    },
    items: {
        type: DataTypes.JSON // Store items array as JSON
    }
}, {
    timestamps: true
});

module.exports = { sequelize, Ingredient, Menu, Order };
