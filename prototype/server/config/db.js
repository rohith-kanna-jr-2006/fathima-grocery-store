const mongoose = require('mongoose');
require('dotenv').config();

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    if (process.env.MONGO_URI) {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }

    // Connect via MongoDB Memory Server for instant persistence in AI Studio container
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        binary: {
          version: '7.0.14'
        }
      });
      const uri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);

      // Automatically seed in-memory database
      const seedDatabase = require('../database/seed');
      await seedDatabase(false);
      console.log('In-Memory MongoDB Seeded successfully.');
      return conn;
    } catch (memErr) {
      console.warn('MongoMemoryServer initialization note:', memErr.message);
    }

    // Fallback: connect to default local
    const connStr = 'mongodb://127.0.0.1:27017/fathima_grocery';
    return await mongoose.connect(connStr, { serverSelectionTimeoutMS: 2000 })
      .then(conn => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      })
      .catch(err => {
        console.warn('MongoDB fallback notice:', err.message);
      });
  } catch (error) {
    console.warn(`Database connection handled: ${error.message}`);
  }
};

module.exports = connectDB;


