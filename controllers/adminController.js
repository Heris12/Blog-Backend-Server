const User = require("../models/user");
const Blog = require("../models/Blog");

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("username email role createdAt updatedAt").sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Unable to load users:", error);
        res.status(500).json({ success: false, message: "Unable to load users" });
    }   
};

exports.getOverview = async (req, res) => {
    try {
        const [totalUsers, totalAuthors, totalPosts, recentUsers, recentPosts] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "author" }),
            Blog.countDocuments(),
            User.find().select("username role createdAt updatedAt").sort({ updatedAt: -1 }).limit(5).lean(),
            Blog.find().select("title author createdAt updatedAt").populate("author", "username").sort({ updatedAt: -1 }).limit(5).lean()
        ]);
        const updates = [
            ...recentUsers.map(user => ({
                type: user.createdAt.getTime() === user.updatedAt.getTime() ? "user-created" : "user-updated",
                label: user.createdAt.getTime() === user.updatedAt.getTime()
                    ? `${user.username} joined as ${user.role}`
                    : `${user.username}'s account was updated`,
                date: user.updatedAt
            })),
            ...recentPosts.map(post => ({
                type: post.createdAt.getTime() === post.updatedAt.getTime() ? "post-created" : "post-updated",
                label: post.createdAt.getTime() === post.updatedAt.getTime()
                    ? `${post.author?.username || "An author"} published “${post.title}”`
                    : `${post.author?.username || "An author"} updated “${post.title}”`,
                date: post.updatedAt
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

        res.status(200).json({
            success: true,
            data: { totalUsers, totalAuthors, totalPosts, updates }
        });
    } catch (error) {
        console.error("Unable to load admin overview:", error);
        res.status(500).json({ success: false, message: "Unable to load dashboard overview" });
    }
};

exports.getPosts = async (req, res) => {
    try {
        const authorName = typeof req.query.author === "string" ? req.query.author.trim() : "";
        let filter = {};

        if (authorName) {
            const escapedName = authorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const matchingUsers = await User.find({
                username: { $regex: escapedName, $options: "i" },
                role: { $in: ["author", "admin"] }
            }).select("_id").lean();
            filter = { author: { $in: matchingUsers.map(user => user._id) } };
        }

        const posts = await Blog.find(filter)
            .populate("author", "username role")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, data: posts });
    } catch (error) {
        console.error("Unable to load admin posts:", error);
        res.status(500).json({ success: false, message: "Unable to load posts" });
    }
};

const validateUserInput = ({ username, email, password, role }, requirePassword) => {
    const normalizedUsername = typeof username === "string" ? username.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedUsername || !normalizedEmail || (requirePassword && typeof password !== "string")) {
        return { error: "Username, email, and password are required" };
    }
    if (role !== undefined && !["user", "author"].includes(role)) {
        return { error: "Role must be user or author" };
    }
    return { username: normalizedUsername, email: normalizedEmail, password, role };
};

exports.createUser = async (req, res) => {
    try {
        const input = validateUserInput(req.body, true);
        if (input.error) {
            return res.status(400).json({ success: false, message: input.error });
        }
        const user = await User.create({
            username: input.username,
            email: input.email,
            password: input.password,
            role: input.role || "user"
        });
        res.status(201).json({
            success: true,
            data: { id: user._id, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError" || error.code === 11000) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Unable to create user:", error);
        res.status(500).json({ success: false, message: "Unable to create user" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("+password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const { username, email, password, role } = req.body;
        const input = validateUserInput({
            username: username === undefined ? user.username : username,
            email: email === undefined ? user.email : email,
            password,
            role
        }, false);
        if (input.error) {
            return res.status(400).json({ success: false, message: input.error });
        }
        if (user.role === "admin" && role !== undefined && role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin accounts cannot be changed to another role here" });
        }
        if (String(user._id) === String(req.user._id) && role !== undefined && role !== "admin") {
            return res.status(403).json({ success: false, message: "You cannot change your own administrator role" });
        }

        user.username = input.username;
        user.email = input.email;
        if (role !== undefined) user.role = role;
        if (typeof password === "string" && password.length > 0) user.password = password;
        await user.save();
        res.status(200).json({
            success: true,
            data: { id: user._id, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        if (error.name === "ValidationError" || error.name === "CastError" || error.code === 11000) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Unable to update user:", error);
        res.status(500).json({ success: false, message: "Unable to update user" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.role === "admin" || String(user._id) === String(req.user._id)) {
            return res.status(403).json({ success: false, message: "Administrator accounts cannot be deleted here" });
        }
        await user.deleteOne();
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, message: "Invalid user id" });
        }
        console.error("Unable to delete user:", error);
        res.status(500).json({ success: false, message: "Unable to delete user" });
    }
};

exports.createAuthor = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const normalizedUsername = typeof username === "string" ? username.trim() : "";
        if (!normalizedUsername || !normalizedEmail || typeof password !== "string") {
            return res.status(400).json({ success: false, message: "Username, email, and password are required" });
        }

        // Check if the user exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Create new user
        const user = await User.create({ 
            username: normalizedUsername, 
            email: normalizedEmail, 
            password, 
            role: "author"
        });
        res.status(201).json({ 
            success: true, 
            message: "Author created successfully", 
            data: { 
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        if (error.name === "ValidationError" || error.code === 11000) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Unable to create author:", error);
        res.status(500).json({ success: false, message: "Unable to create author" });
    }   
};