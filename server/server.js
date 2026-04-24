const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("./config/passport");
const connectDB = require("./config/db");
const seedAdmin = require("./utils/seedAdmin");
const startCronJobs = require("./utils/cronJobs");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

// ── Security middleware ──────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// ── Rate limiters ────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many OTP requests. Try again in 15 minutes." },
});

// ── Routes ───────────────────────────────────
app.get("/", (req, res) => res.json({ message: "TaskFlow API is running..." }));

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/send-otp", otpLimiter);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/invite", require("./routes/inviteRoutes"));
app.use("/api/2fa", require("./routes/twoFactorRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// ── Socket.io ────────────────────────────────
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ── Cron jobs ────────────────────────────────
startCronJobs(io);

// ── DB + Start ───────────────────────────────
connectDB().then(() => {
  seedAdmin();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});