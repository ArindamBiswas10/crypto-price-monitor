import { Router } from 'express';
import { priceController } from '../controllers/priceController';

const router = Router();


router.get('/', priceController.getCurrentPrices);

router.get('/search', priceController.searchCoins);

router.get('/supported', priceController.getSupportedCoins);

router.get('/stats', priceController.getApiStats);

router.get('/:symbol/history', priceController.getPriceHistory);

router.get('/:symbol', priceController.getCoinPrice);



export default router;