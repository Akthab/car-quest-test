"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const express = require('express');
// require('dotenv').config();
// const app = express();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
// const mongoose = require('mongoose');
// import Person from './models/Person.model';
const route_1 = __importDefault(require("./router/route"));
const port = 3000;
require('dotenv').config();
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
// Connect to MongoDB using Mongoose
mongoose_1.default.connect(process.env.MONGODB_URI);
// Check MongoDB connection
const db = mongoose_1.default.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});
app.use(express_1.default.json());
app.use('/api', route_1.default);
// Route to save a person
// app.post('/persons', async (req, res) => {
// 	try {
// 		const { name, age } = req.body;
// 		// Create a new document
// 		// Create a new person instance
// 		const newPerson = new Person({ name, age });
// 		// Save the person to the database
// 		const savedPerson = await newPerson.save();
// 		res.status(201).json(savedPerson);
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ error: 'Internal Server Error' });
// 	}
// 	// Other routes and app configuration...
// });
app.get('/hello', (req, res) => {
    res.send('Hello, Express!');
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
