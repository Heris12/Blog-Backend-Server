const Blog = require("../models/Blog");

// Get all blogs
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate("author", "username")
            .sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get posts created by the authenticated author
exports.getMyBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user._id })
            .populate("author", "username")
            .sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        console.error("Unable to load author's posts:", error);
        res.status(500).json({ message: "Unable to load your posts" });
    }
};

// Get a single blog by id
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate("author", "username");
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new blog
exports.createBlog = async (req, res) => {
    try {
        const { title, body} = req.body;
        const newBlog = new Blog({ title, body, author: req.user._id });
        const savedBlog = await newBlog.save();
        res.status(201).json({success: true, data: savedBlog});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Edit a blog
exports.editBlog = async (req, res) => {
    try {
        const { title, body } = req.body;
        let blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        if (req.user.role !== "admin" && String(blog.author) !== String(req.user._id)) {
            return res.status(403).json({ message: "You can only edit your own posts" });
        }
        blog.title = title || blog.title;
        blog.body = body || blog.body;
        
        await blog.save();
        res.status(200).json({success: true, data: blog});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        if (req.user.role !== "admin" && String(blog.author) !== String(req.user._id)) {
            return res.status(403).json({ message: "You can only delete your own posts" });
        }
        await blog.deleteOne();
        res.status(200).json({success: true, message: "Blog deleted successfully"});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};