"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
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
app.get('/hello', (req, res) => {
    res.send('Hello, Express!');
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
