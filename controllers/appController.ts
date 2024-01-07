import UserModel from './../models/User.model';
import bcrypt from 'bcryptjs';

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