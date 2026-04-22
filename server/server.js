const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("./config/passport");
const connectDB = require("./config/db");
const seedAdmin = require("./utils/seedAdmin");
const startCronJobs = require("./utils/cronJobs");

dotenv.config();
connectDB();

connectDB().then(() => seedAdmin());

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Make io accessible in controllers
app.set("io", io);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.get("/", (req, res) => res.json({ message: "TaskFlow API is running..." }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/invite", require("./routes/inviteRoutes"));

app.use("/api/analytics", require("./routes/analyticsRoutes"));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  // User joins their own room using their userId
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
startCronJobs(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));