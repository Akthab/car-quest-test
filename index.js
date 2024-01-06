const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
const MongoClient = require('mongodb').MongoClient;

// Connect to MongoDB directly
MongoClient.connect(process.env.MONGODB_URI, (err, client) => {
	if (err) throw err;

	const db = client.db(); // Use your database name

	console.log('Connected to MongoDB');

	// Define the Person collection manually
	const personCollection = db.collection('persons');

	// Route to save a person
	app.post('/persons', async (req, res) => {
		try {
			const { name, age } = req.body;

			// Create a new document
			const newPerson = { name, age };

			// Insert the person into the collection
			const result = await personCollection.insertOne(newPerson);

			res.status(201).json(result.insertedId); // Send the inserted document's _id
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: 'Internal Server Error' });
		}
	});

	// Other routes and app configuration...
});

// ... rest of your app code ...

app.get('/hello', (req, res) => {
	res.send('Hello, Express!');
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
