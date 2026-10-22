const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/user");

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
            
            const existingAdmin = await User.findOne({ email : "admin@gmail.com" });
            if (existingAdmin) {
                console.log("Admin user already exists");
                return;
            }

            await User.create({
                username: "admin",
                email: "admin@gmail.com",
                password: "admin123",
                role: "admin",
            });

            console.log("Admin seeded successfully");
            console.log("Email: admin@gmail.com");
            console.log("Password: admin123");
            process.exit();

        } catch (error) {
            console.error("Error seeding admin:", error.message);
            process.exit(1);
        }
};

seedAdmin();