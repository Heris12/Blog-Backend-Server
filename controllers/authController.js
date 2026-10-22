const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user");

const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });
};


// Register new user
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // if (!username || !email || !password) {
        //     return res.status(400).json({ message: "Please provide username, email, and password" });
        // }

        const user = new User({ username, email, password });
        await user.save();
        const token = generateToken(user);
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                }
            },
        });
    } catch (error) {
        res.status(400).json({ message: error.message || "Registration failed" });
    }
};

// Login a new user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = typeof email === "string"
            ? email.trim().toLowerCase()
            : "";
        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email: normalizedEmail }).select("+password");
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user);
        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                }
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message || "Login failed" });
    }
};


// Get current logged-in user
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message || "Unable to fetch current user" });
    }
};
