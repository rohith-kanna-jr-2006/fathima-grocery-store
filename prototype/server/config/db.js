const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config();

let connectionPromise = null;

const ensureMongodRunning = () => {
  try {
    const mongodPath = '/tmp/mongodb-binaries/mongod-x64-debian-7.0.14';
    const dbPath = '/tmp/mongo-db';
    if (fs.existsSync(mongodPath)) {
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }
      try {
        execSync(`${mongodPath} --port 27017 --dbpath ${dbPath} --fork --logpath /tmp/mongod.log --bind_ip 127.0.0.1`, { stdio: 'ignore' });
      } catch (e) {
        // mongod might already be running, which is fine
      }
    }
  } catch (err) {
    console.warn('[Database] Daemon ensure note:', err.message);
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      ensureMongodRunning();
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fathima_grocery';
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

      // Automatically seed database if empty
      const Category = require('../models/Category');
      const catCount = await Category.countDocuments();
      if (catCount === 0) {
        console.log('[Database] Database is empty. Seeding initial records...');
        const seedDatabase = require('../database/seed');
        await seedDatabase(false);
        console.log('[Database] Database Seeded successfully.');
      }

      return conn;
    } catch (error) {
      console.error('[Database] Connection error:', error.message);
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
};

module.exports = connectDB;


