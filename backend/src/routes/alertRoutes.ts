import { Router } from 'express';
import { alertController } from '../controllers/alertController';
import { validateAlert, validateUpdateAlert } from '../middleware/validation';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/', validateAlert, alertController.createAlert);

router.get('/', alertController.getUserAlerts);

router.get('/stats', alertController.getAlertStats);

router.put('/:id', validateUpdateAlert, alertController.updateAlert);

router.delete('/:id', alertController.deleteAlert);

export default router;