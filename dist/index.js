"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const Person_model_1 = __importDefault(require("./models/Person.model"));
// const Person = require('./models/Person.model');
const MongoClient = require('mongodb').MongoClient;
// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGODB_URI);
// Check MongoDB connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});
app.use(express.json());
// Route to save a person
app.post('/persons', async (req, res) => {
    try {
        const { name, age } = req.body;
        // Create a new document
        // Create a new person instance
        const newPerson = new Person_model_1.default({ name, age });
        // Save the person to the database
        const savedPerson = await newPerson.save();
        res.status(201).json(savedPerson);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    // Other routes and app configuration...
});
app.get('/hello', (req, res) => {
    res.send('Hello, Express!');
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
