import { Router } from 'express';
import { UsersController } from './users.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Toda la gestión de empleados requiere estar autenticado y tener rol manager o admin
router.use(requireAuth);
router.use(requireRole('manager', 'admin'));

router.get('/', UsersController.getAllUsers);
router.get('/history', UsersController.getLoginHistory);
router.get('/:id', UsersController.getUserById);
router.post('/', UsersController.createUser);
router.put('/:id', UsersController.updateUser);
router.patch('/:id/reset-password', UsersController.resetPassword);
router.patch('/:id/toggle-status', UsersController.toggleStatus);

export const usersRouter = router;
