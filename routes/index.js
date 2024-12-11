import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

// Use JSON middleware
router.use(express.json());

// Define routes
router.get('/stats', AppController.getStats);
router.get('/status', AppController.getStatus);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// Ensure all routes for FilesController exist
router.post('/files', FilesController.postUpload); // POST /files
router.get('/files/:id', FilesController.getShow); // GET /files/:id
router.get('/files/:id/data', FilesController.getFileData); // GET /files/:id/data
router.put('/files/:id/publish', FilesController.publishFile); // PUT /files/:id/publish
router.put('/files/:id/unpublish', FilesController.unpublishFile); // PUT /files/:id/unpublish

// Export the router
export default router;

