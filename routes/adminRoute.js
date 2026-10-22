const express = require('express');
const router = express.Router();
const { getAllUsers, getOverview, getPosts, createUser, updateUser, deleteUser, createAuthor } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // Apply authentication middleware to all routes in this router
router.use(authorize('admin')); // Apply authorization middleware to all routes in this router

router.get('/overview', getOverview);
router.get('/posts', getPosts);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/create-authors', createAuthor);

module.exports = router;