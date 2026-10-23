const express = require("express")
const cors = require("cors")

const connectDB = require("./config/database")
connectDB()

const app = express()
app.use(express.json())


const allowOrigin = [
    "http://localhost:3000",
    process.env.CLIENT_URL
]

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowOrigin.indexOf(origin) === -1 && !origin.endsWithWith(".vercel.app/")) {
            return callback(new Error("Not allowed by CORS"));
        }
        return callback(null, true);
    },
    credentials: true
}
))

// Test route
app.get("/",(req, res) => {
    res.send("API is running...")
})

//Routes
app.use("/api/blogs", require("./routes/blogRoutes"))
app.use("/api/auth", require("./routes/authRoute"))
app.use("/api/admin", require("./routes/adminRoute"))

const PORT = process.env.PORT || 3000

// start server
app.listen(PORT, () => {
    console.log(`server is running on port http://localhost:${PORT}`)
})