import { Router } from 'express';
const router = Router();

import * as controller from '../controllers/appController';

// router.use(requireAuth);
router.route('/register').post(controller.register); // register user
router.route('/login').post(controller.login); // login user

export default router;
