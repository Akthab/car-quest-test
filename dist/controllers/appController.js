"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const User_model_1 = __importDefault(require("./../models/User.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/** POST: http://localhost:8080/api/register
 * @param: {
  "firstName" : "Hello",
  "lastName": "World",
  "phoneNumber": "+94 71 234 5678"
  "email": "hello@gmail.com"
  "password" : "admin123"
}
*/
async function register(req, res) {
    try {
        const newPassword = await bcryptjs_1.default.hash(req.body.password, 10); // Hash the password
        const user = new User_model_1.default({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            password: newPassword, // Use the hashed password
        });
        await user.save();
        res.send({ status: 'User registered successfully' });
    }
    catch (err) {
        // Handle errors
        if (err.code === 11000 && err.keyPattern.email) {
            // Duplicate email error
            res.send({ status: 'error', error: 'Duplicate email' });
        }
        else if (err.code === 11000 && err.keyPattern.phoneNumber) {
            // Duplicate phone number error
            res.send({ status: 'error', error: 'Duplicate phone number' });
        }
        else {
            // Other errors
            console.error('Registration error:', err);
            res.send({ status: 'error', error: 'Internal Server Error' });
        }
    }
}
exports.register = register;
