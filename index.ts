import express from 'express';
import mongoose from 'mongoose';
import router from './router/route';

const port = 3000;

require('dotenv').config();
const app = express();

app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGODB_URI);

// Check MongoDB connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
	console.log('Connected to MongoDB');
});

app.use(express.json());

app.use('/api', router);

app.get('/hello', (req, res) => {
	res.send('Hello, Express!');
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
