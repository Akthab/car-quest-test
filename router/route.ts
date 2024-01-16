import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

import * as controller from '../controllers/appController';

// router.use(requireAuth);
router.route('/register').post(controller.register); // register user
router.route('/login').post(controller.login); // login user
router
	.route('/getUserDetailsByHeader')
	.get(requireAuth, controller.getUserDetailsByHeader); // get user details by header
router.route('/addPost').post(requireAuth, controller.addPost); // add post
router.route('/newAddPost').post(controller.newAddPost);
router.route('/brandNewAddPost').post(controller.brandNewAddPost);

export default router;
