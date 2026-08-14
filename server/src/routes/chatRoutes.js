import { Router } from 'express'; import { createChat, endChat } from '../controllers/chatController.js';
const router = Router(); router.post('/', createChat); router.patch('/:id/end', endChat); export default router;
