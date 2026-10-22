const express = require('express');
const router = express.Router();
const {getAllBlogs, getMyBlogs, createBlog, editBlog, getBlogById, deleteBlog} = require("../controllers/blogController");
const { protect, optionalProtect, authorize } = require("../middleware/auth");

//@route GET /api/blogs
router.get('/', optionalProtect, getAllBlogs);

//@route GET /api/blogs/mine
router.get('/mine', protect, authorize('author'), getMyBlogs);

//@route POST /api/blogs
router.post('/', protect, authorize('admin', 'author'), createBlog);

//@route PUT /api/blogs
router.put('/:id', protect, authorize('admin', 'author'), editBlog);

//@route GET /api/blogs/:id
router.get('/:id', optionalProtect, getBlogById);
    
//@route DELETE /api/blogs/:id
router.delete('/:id', protect, authorize('admin', 'author'), deleteBlog);

module.exports = router;