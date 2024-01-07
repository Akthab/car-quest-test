import UserModel from './../models/User.model';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import ResponseService from '../services/response.service';
import { ResponseMessage, ResponseCode } from '../constants/response';
import jwt from 'jsonwebtoken';
import { UserDetailsResponse } from '../model/userResponse';

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
