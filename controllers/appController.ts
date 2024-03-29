import UserModel from './../models/User.model';
import PostModel from '../models/Post.model.js';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import ResponseService from '../services/response.service';
import { ResponseMessage, ResponseCode } from '../constants/response';
import jwt from 'jsonwebtoken';
import { UserDetailsResponse } from '../model/userResponse';
import multer from 'multer';
import { S3 } from '@aws-sdk/client-s3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream } from 'fs';

/** POST: http://localhost:8080/api/register 
 * @param: {
  "firstName" : "Hello",
  "lastName": "World",
  "phoneNumber": "+94 71 234 5678"
  "email": "hello@gmail.com"
  "password" : "admin123"
}
*/
export async function register(req, res) {
	try {
		const newPassword = await bcrypt.hash(req.body.password, 10); // Hash the password
		const user = new UserModel({
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			phoneNumber: req.body.phoneNumber,
			password: newPassword, // Use the hashed password
		});

		await user.save();

		res.send({ status: 'User registered successfully' });
	} catch (err) {
		// Handle errors
		if (err.code === 11000 && err.keyPattern.email) {
			// Duplicate email error
			res.send({ status: 'error', error: 'Duplicate email' });
		} else if (err.code === 11000 && err.keyPattern.phoneNumber) {
			// Duplicate phone number error
			res.send({ status: 'error', error: 'Duplicate phone number' });
		} else {
			// Other errors
			console.error('Registration error:', err);
			res.send({ status: 'error', error: 'Internal Server Error' });
		}
	}
}

/** POST: http://localhost:8080/api/login 
 * @param: {
  "email" : "hello@gmail.com",
  "password" : "name+1234"
}
*/
export async function login(req, res) {
	try {
		const user = await UserModel.findOne({
			email: req.body.email,
		});

		if (!user) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.send(
					ResponseService.respond(
						ResponseCode.USER_ERROR,
						ResponseMessage.NO_USER
					)
				);
		}

		if (typeof req.body.password === 'undefined' || req.body.password === '') {
			// Password is empty or undefined
			return res
				.status(StatusCodes.NOT_ACCEPTABLE)
				.send(
					ResponseService.respond(
						ResponseCode.USER_ERROR,
						ResponseMessage.NO_PASSWORD
					)
				);
		}

		const isPasswordValid = await bcrypt.compare(
			req.body.password,
			user.password
		);

		if (isPasswordValid) {
			const token = jwt.sign(
				{
					name: user.firstName,
					email: user.email,
				},
				process.env.JWT_SECRET_KEY
			);

			return res
				.status(StatusCodes.OK)
				.send(
					ResponseService.respond(
						ResponseCode.AUTH_SUCCESS,
						ResponseMessage.LOGIN_SUCCESS,
						token
					)
				);
		} else {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.send(
					ResponseService.respond(
						ResponseCode.USER_ERROR,
						ResponseMessage.INVALID_CREDENTIALS
					)
				);
		}
	} catch (error) {
		return res
			.status(StatusCodes.BAD_REQUEST)
			.send(
				ResponseService.respond(
					ResponseCode.SERVER_ERROR,
					ResponseMessage.INTERNAL_SERVER_ERROR
				)
			);
	}
}

/** POST: http://localhost:8080/api/getUserDetailsByHeader 
 * @param: {
 * jwtToken: eyzxcvbnbvcxvbnmbnmmnbvbnmnbvbnmnbv
}
*/
export async function getUserDetailsByHeader(req, res) {
	try {
		const user = req.user;

		if (user != null) {
			const userDetailsResponse = new UserDetailsResponse(
				user.id,
				user.firstName,
				user.lastName,
				user.email,
				user.phoneNumber
			);

			return res
				.status(StatusCodes.OK)
				.send(
					ResponseService.respond(
						ResponseCode.FETCH_USER_DETAILS_SUCCESS,
						ResponseMessage.GET_USER_DETAILS_SUCCESS,
						userDetailsResponse
					)
				);
		} else {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.send(
					ResponseService.respond(
						ResponseCode.USER_ERROR,
						ResponseMessage.NO_USER
					)
				);
		}
	} catch (error) {
		res.json({ status: 'error', error: 'invalid token' });
	}
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function uploadImage(imageFile) {
	const file = imageFile;
	const fileBuffer = Buffer.from(file.buffer);

	const client = new S3Client({ region: process.env.AWS_REGION });
	const imageKey = uuidv4();
	const uploadCommand = new PutObjectCommand({
		Bucket: process.env.AWS_S3_BUCKET,
		Key: imageKey,
		Body: fileBuffer,
	});

	try {
		await client.send(uploadCommand);

		const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;

		return imageUrl;
	} catch (error) {
		throw error;
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

export async function addPost(req, res) {
	let postImageUrl = null;

	try {
		await new Promise<void>((resolve, reject) => {
			upload.single('image')(req, res, (err) => {
				if (err) {
					console.error('Error during file upload:', err);
					reject(err);
				} else {
					resolve();
				}
			});
		});

		if (req.file) {
			const file = req.file;
			const fileBuffer = Buffer.from(file.buffer);

			const client = new S3Client({ region: process.env.AWS_REGION });

			const imageKey = uuidv4();
			const uploadCommand = new PutObjectCommand({
				Bucket: process.env.AWS_S3_BUCKET,
				Key: imageKey,
				Body: fileBuffer,
			});

			await client.send(uploadCommand);

			postImageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
		}

		const post = await PostModel.create({
			postTitle: req.body.postTitle,
			postDescription: req.body.postDescription,
			postCarMake: req.body.postCarMake,
			postCarYear: req.body.postCarYear,
			postCarType: req.body.postCarType,
			postCarFuelType: req.body.postCarFuelType,
			postImageUrl: postImageUrl,
		});

		res.json({ message: 'Post creation successful' });
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
}
