/**
 * Database Seed Script
 * 
 * This script populates the database with sample data for testing purposes.
 * It creates users, products, and warranties with realistic data.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Import models
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Warranty = require('../models/warranty.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warrity')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Generate random date between start and end
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Calculate warranty status based on expiration date
const calculateStatus = (expirationDate) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  if (expirationDate < now) {
    return 'expired';
  } else if (expirationDate < thirtyDaysFromNow) {
    return 'expiring';
  } else {
    return 'active';
  }
};

// Create sample users
const createUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      phone: faker.phone.number(),
      bio: 'System administrator',
      preferences: {
        emailNotifications: true,
        reminderDays: 14
      }
    });
    
    await admin.save();
    console.log('Admin user created:', admin.email);
    
    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = new User({
      name: 'Test User',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      phone: faker.phone.number(),
      bio: 'Regular application user',
      preferences: {
        emailNotifications: true,
        reminderDays: 7
      }
    });
    
    await user.save();
    console.log('Regular user created:', user.email);
    
    return { admin, user };
  } catch (error) {
    console.error('Error creating users:', error);
    throw error;
  }
};

// Create sample products
const createProducts = async (userId) => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    
    const products = [];
    const categories = ['Electronics', 'Appliances', 'Furniture', 'Automotive', 'Tools'];
    
    // Create 10 products
    for (let i = 0; i < 10; i++) {
      const product = new Product({
        user: userId,
        name: faker.commerce.productName(),
        category: faker.helpers.arrayElement(categories),
        model: faker.string.alphanumeric(8).toUpperCase(),
        manufacturer: faker.company.name(),
        serialNumber: faker.string.alphanumeric(12).toUpperCase(),
        purchaseDate: randomDate(new Date(2020, 0, 1), new Date()),
        price: faker.commerce.price({ min: 100, max: 2000 }),
        purchaseLocation: faker.company.name(),
        receiptNumber: faker.string.alphanumeric(10).toUpperCase(),
        description: faker.commerce.productDescription(),
        notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.7 })
      });
      
      await product.save();
      products.push(product);
    }
    
    console.log(`Created ${products.length} products`);
    return products;
  } catch (error) {
    console.error('Error creating products:', error);
    throw error;
  }
};

// Create sample warranties
const createWarranties = async (userId, products) => {
  try {
    // Clear existing warranties
    await Warranty.deleteMany({});
    
    const warranties = [];
    
    // Create warranties for each product
    for (const product of products) {
      // Generate random dates for warranty
      const purchaseDate = product.purchaseDate;
      
      // Random warranty duration between 1-5 years
      const warrantyYears = faker.number.int({ min: 1, max: 5 });
      const expirationDate = new Date(purchaseDate);
      expirationDate.setFullYear(expirationDate.getFullYear() + warrantyYears);
      
      // Calculate status based on expiration date
      const status = calculateStatus(expirationDate);
      
      const warranty = new Warranty({
        user: userId,
        product: product._id,
        purchaseDate: purchaseDate,
        expirationDate: expirationDate,
        warrantyProvider: faker.company.name(),
        warrantyNumber: faker.string.alphanumeric(10).toUpperCase(),
        coverageDetails: faker.lorem.paragraph(),
        documents: [
          {
            name: 'Warranty Certificate.pdf',
            path: '/uploads/warranty-certificate.pdf',
            uploadDate: new Date()
          },
          {
            name: 'Purchase Receipt.pdf',
            path: '/uploads/purchase-receipt.pdf',
            uploadDate: new Date()
          }
        ],
        status: status,
        notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.6 })
      });
      
      await warranty.save();
      warranties.push(warranty);
    }
    
    console.log(`Created ${warranties.length} warranties`);
    return warranties;
  } catch (error) {
    console.error('Error creating warranties:', error);
    throw error;
  }
};

// Main function to seed the database
const seedDatabase = async () => {
  try {
    const { admin, user } = await createUsers();
    const products = await createProducts(user._id);
    const warranties = await createWarranties(user._id, products);
    
    console.log('Database seeded successfully!');
    console.log('----------------------------');
    console.log('Admin login: admin@example.com / admin123');
    console.log('User login: user@example.com / user123');
    console.log(`Created ${products.length} products and ${warranties.length} warranties`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
