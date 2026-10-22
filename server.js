const express = require("express")
const cors = require("cors")

const connectDB = require("./config/database")
connectDB()

const app = express()
app.use(express.json())
app.use(cors())

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