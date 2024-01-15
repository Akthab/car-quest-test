"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPost = exports.getUserDetailsByHeader = exports.login = exports.register = void 0;
const User_model_1 = __importDefault(require("./../models/User.model"));
const Post_model_js_1 = __importDefault(require("../models/Post.model.js"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = require("http-status-codes");
const response_service_1 = __importDefault(require("../services/response.service"));
const response_1 = require("../constants/response");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userResponse_1 = require("../model/userResponse");
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
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
/** POST: http://localhost:8080/api/login
 * @param: {
  "email" : "hello@gmail.com",
  "password" : "name+1234"
}
*/
async function login(req, res) {
    try {
        const user = await User_model_1.default.findOne({
            email: req.body.email,
        });
        if (!user) {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .send(response_service_1.default.respond(response_1.ResponseCode.USER_ERROR, response_1.ResponseMessage.NO_USER));
        }
        if (typeof req.body.password === 'undefined' || req.body.password === '') {
            // Password is empty or undefined
            return res
                .status(http_status_codes_1.StatusCodes.NOT_ACCEPTABLE)
                .send(response_service_1.default.respond(response_1.ResponseCode.USER_ERROR, response_1.ResponseMessage.NO_PASSWORD));
        }
        const isPasswordValid = await bcryptjs_1.default.compare(req.body.password, user.password);
        if (isPasswordValid) {
            const token = jsonwebtoken_1.default.sign({
                name: user.firstName,
                email: user.email,
            }, process.env.JWT_SECRET_KEY);
            return res
                .status(http_status_codes_1.StatusCodes.OK)
                .send(response_service_1.default.respond(response_1.ResponseCode.AUTH_SUCCESS, response_1.ResponseMessage.LOGIN_SUCCESS, token));
        }
        else {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .send(response_service_1.default.respond(response_1.ResponseCode.USER_ERROR, response_1.ResponseMessage.INVALID_CREDENTIALS));
        }
    }
    catch (error) {
        return res
            .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
            .send(response_service_1.default.respond(response_1.ResponseCode.SERVER_ERROR, response_1.ResponseMessage.INTERNAL_SERVER_ERROR));
    }
}
exports.login = login;
/** POST: http://localhost:8080/api/getUserDetailsByHeader
 * @param: {
 * jwtToken: eyzxcvbnbvcxvbnmbnmmnbvbnmnbvbnmnbv
}
*/
async function getUserDetailsByHeader(req, res) {
    try {
        const user = req.user;
        if (user != null) {
            const userDetailsResponse = new userResponse_1.UserDetailsResponse(user.id, user.firstName, user.lastName, user.email, user.phoneNumber);
            return res
                .status(http_status_codes_1.StatusCodes.OK)
                .send(response_service_1.default.respond(response_1.ResponseCode.FETCH_USER_DETAILS_SUCCESS, response_1.ResponseMessage.GET_USER_DETAILS_SUCCESS, userDetailsResponse));
        }
        else {
            return res
                .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
                .send(response_service_1.default.respond(response_1.ResponseCode.USER_ERROR, response_1.ResponseMessage.NO_USER));
        }
    }
    catch (error) {
        res.json({ status: 'error', error: 'invalid token' });
    }
}
exports.getUserDetailsByHeader = getUserDetailsByHeader;
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
async function uploadImage(imageFile) {
    const file = imageFile;
    const fileBuffer = Buffer.from(file.buffer);
    const client = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
    const imageKey = (0, uuid_1.v4)();
    const uploadCommand = new client_s3_1.PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: imageKey,
        Body: fileBuffer,
    });
    try {
        await client.send(uploadCommand);
        const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
        return imageUrl;
    }
    catch (error) {
        console.log(error);
    }
}
/** POST: http://localhost:8080/api/addPost
 * @param: {
  "postTitle" : "Misfiring in the engine",
  "postDescription": "The engine keeps misfiring when the rpm is above 2000rpm",
  "postCarMake": "Toyota",
  "postCarModel": "Camry",
  "postCarType": "Sedan",
  "postImageUrl": "https/xyzzz/aabcccc/ghjjjj"
}
*/
async function addPost(req, res) {
    try {
        const uploadMiddleware = upload.single('image');
        await uploadMiddleware(req, res, async (err) => {
            let postImageUrl = null;
            console.log(req.file);
            if (req.file) {
                console.log('Has a file');
                postImageUrl = await uploadImage(req.file);
            }
            const post = await Post_model_js_1.default.create({
                postTitle: req.body.postTitle,
                postDescription: req.body.postDescription,
                postCarMake: req.body.postCarMake,
                postCarYear: req.body.postCarYear,
                postCarType: req.body.postCarType,
                postCarFuelType: req.body.postCarFuelType,
                postImageUrl: postImageUrl,
            });
        });
        res.json({ message: 'Post creation successful' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}
exports.addPost = addPost;
