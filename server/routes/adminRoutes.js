const express = require("express");
const router = express.Router();
const { 
  getPendingRegistrations,
  getAllUsers,
  approveRegistration,
  rejectRegistration,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser,
  sendInvite
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorizeRoles("admin"));

// Registration management
router.get("/pending-registrations", getPendingRegistrations);
router.patch("/approve-registration/:id", approveRegistration);
router.patch("/reject-registration/:id", rejectRegistration);

// User management — BOD and above only
router.get("/users", protect, authorizeRoles("admin", "bod"), getAllUsers);
router.patch("/users/:id/role", protect, authorizeRoles("admin", "bod"), updateUserRole);
router.patch("/users/:id/deactivate", protect, authorizeRoles("admin", "bod"), deactivateUser);
router.patch("/users/:id/activate", protect, authorizeRoles("admin", "bod"), activateUser);

router.delete("/users/:id", deleteUser);

// Invites
router.post("/invite", sendInvite);


const { seedDummyData, removeDummyData } = require("../utils/seedDummyData");

// Seed dummy data — admin only
router.post("/seed-dummy", protect, authorizeRoles("admin"), async (req, res) => {
  await seedDummyData();
  res.json({ message: "Dummy data seeded successfully" });
});

// Remove dummy data — admin only
router.delete("/seed-dummy", protect, authorizeRoles("admin"), async (req, res) => {
  await removeDummyData();
  res.json({ message: "Dummy data removed successfully" });
});

module.exports = router;