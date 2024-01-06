const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const Person = require('./models/personModel');

// const dbURI = 'mongodb://localhost:27017/your-database-name';

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGODB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

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

		// Create a new person instance
		const newPerson = new Person({ name, age });

		// Save the person to the database
		const savedPerson = await newPerson.save();

		res.status(201).json(savedPerson);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.get('/hello', (req, res) => {
	res.send('Hello, Express!');
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
