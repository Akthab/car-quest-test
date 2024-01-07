"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require('mongoose');
const personSchema = new mongoose.Schema({
    name: String,
    age: Number,
});
const Person = mongoose.model('Users', personSchema);
exports.default = Person;
