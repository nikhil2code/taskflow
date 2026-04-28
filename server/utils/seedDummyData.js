const User = require("../models/userModel");
const Task = require("../models/taskModel");
const bcrypt = require("bcryptjs");
const { ROLE_LEVELS } = require("../models/userModel");

const seedDummyData = async () => {
  try {
    // Check if dummy data already exists
    const existing = await User.findOne({ email: "bod@taskflow.com" });
    if (existing) {
      console.log("✅ Dummy data already exists");
      return;
    }

    const salt = await bcrypt.genSalt(10);

    // ── Create dummy users for each role ──────────────
    const users = await User.insertMany([
      {
        name: "Robert Anderson",
        email: "bod@taskflow.com",
        password: await bcrypt.hash("Test@1234", salt),
        role: "bod",
        roleLevel: ROLE_LEVELS["bod"],
        phoneNo: "+91 98100 00001",
        gender: "male",
        accountApproved: true,
        accountStatus: "ACTIVE",
        authMethod: "local",
      },
      {
        name: "Sarah Mitchell",
        email: "manager@taskflow.com",
        password: await bcrypt.hash("Test@1234", salt),
        role: "manager",
        roleLevel: ROLE_LEVELS["manager"],
        phoneNo: "+91 98100 00002",
        gender: "female",
        accountApproved: true,
        accountStatus: "ACTIVE",
        authMethod: "local",
      },
      {
        name: "James Wilson",
        email: "teamlead@taskflow.com",
        password: await bcrypt.hash("Test@1234", salt),
        role: "teamlead",
        roleLevel: ROLE_LEVELS["teamlead"],
        phoneNo: "+91 98100 00003",
        gender: "male",
        accountApproved: true,
        accountStatus: "ACTIVE",
        authMethod: "local",
      },
      {
        name: "Emily Johnson",
        email: "employee@taskflow.com",
        password: await bcrypt.hash("Test@1234", salt),
        role: "employee",
        roleLevel: ROLE_LEVELS["employee"],
        phoneNo: "+91 98100 00004",
        gender: "female",
        accountApproved: true,
        accountStatus: "ACTIVE",
        authMethod: "local",
      },
      {
        name: "David Brown",
        email: "employee2@taskflow.com",
        password: await bcrypt.hash("Test@1234", salt),
        role: "employee",
        roleLevel: ROLE_LEVELS["employee"],
        phoneNo: "+91 98100 00005",
        gender: "male",
        accountApproved: true,
        accountStatus: "ACTIVE",
        authMethod: "local",
      },
    ]);

    console.log("✅ Dummy users created");

    // Get user references
    const bod = users[0];
    const manager = users[1];
    const teamlead = users[2];
    const employee1 = users[3];
    const employee2 = users[4];

    // ── Create dummy tasks ──────────────────────────
    await Task.insertMany([
      {
        title: "Build Login Page UI",
        description: "Create responsive login page with email/password fields, validation, and error handling.",
        assignedTo: employee1._id,
        assignedBy: manager._id,
        createdBy: manager._id,
        updatedBy: manager._id,
        status: "in_progress",
        percentageCompleted: 60,
        priority: "high",
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        tags: ["frontend", "ui", "react"],
      },
      {
        title: "Setup MongoDB Database",
        description: "Configure MongoDB Atlas cluster, create collections, and set up indexes for optimal performance.",
        assignedTo: employee2._id,
        assignedBy: manager._id,
        createdBy: manager._id,
        updatedBy: manager._id,
        status: "approved",
        percentageCompleted: 100,
        priority: "high",
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        tags: ["backend", "database"],
      },
      {
        title: "Write API Documentation",
        description: "Document all REST API endpoints with request/response examples using Postman or Swagger.",
        assignedTo: employee1._id,
        assignedBy: teamlead._id,
        createdBy: teamlead._id,
        updatedBy: employee1._id,
        status: "submitted",
        percentageCompleted: 100,
        priority: "medium",
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
        tags: ["documentation", "api"],
      },
      {
        title: "Implement JWT Authentication",
        description: "Add JWT-based authentication to all protected API routes with refresh token support.",
        assignedTo: employee2._id,
        assignedBy: teamlead._id,
        createdBy: teamlead._id,
        updatedBy: employee2._id,
        status: "rejected",
        percentageCompleted: 40,
        priority: "high",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        tags: ["backend", "security", "auth"],
      },
      {
        title: "Design Dashboard Wireframes",
        description: "Create wireframes for the main dashboard including stats cards, charts, and recent activity feed.",
        assignedTo: employee1._id,
        assignedBy: manager._id,
        createdBy: manager._id,
        updatedBy: manager._id,
        status: "pending",
        percentageCompleted: 0,
        priority: "medium",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ["design", "ui", "frontend"],
      },
      {
        title: "Code Review and Testing",
        description: "Review pull requests for the authentication module and write unit tests for all controller functions.",
        assignedTo: employee2._id,
        assignedBy: teamlead._id,
        createdBy: teamlead._id,
        updatedBy: teamlead._id,
        status: "in_progress",
        percentageCompleted: 30,
        priority: "medium",
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        tags: ["testing", "review", "backend"],
      },
      {
        title: "Deploy to Production",
        description: "Set up CI/CD pipeline and deploy the application to production server with environment configurations.",
        assignedTo: employee1._id,
        assignedBy: bod._id,
        createdBy: bod._id,
        updatedBy: employee1._id,
        status: "in_progress",
        percentageCompleted: 20,
        priority: "high",
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        tags: ["devops", "deployment"],
      },
      {
        title: "Fix Mobile Responsiveness",
        description: "Fix UI issues on mobile devices — navigation menu, task cards, and form layouts.",
        assignedTo: employee2._id,
        assignedBy: manager._id,
        createdBy: manager._id,
        updatedBy: manager._id,
        status: "pending",
        percentageCompleted: 0,
        priority: "low",
        deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        tags: ["frontend", "bug", "mobile"],
      },
    ]);

    console.log("✅ Dummy tasks created");
    console.log("✅ Dummy data seeding complete!");

  } catch (err) {
    console.error("❌ Dummy data seed error:", err.message);
  }
};

// ── Remove dummy data ──────────────────────────────
const removeDummyData = async () => {
  try {
    const dummyEmails = [
      "bod@taskflow.com",
      "manager@taskflow.com",
      "teamlead@taskflow.com",
      "employee@taskflow.com",
      "employee2@taskflow.com",
    ];

    const dummyUsers = await User.find({ email: { $in: dummyEmails } });
    const dummyUserIds = dummyUsers.map(u => u._id);

    await Task.deleteMany({
      $or: [
        { assignedTo: { $in: dummyUserIds } },
        { assignedBy: { $in: dummyUserIds } },
        { createdBy: { $in: dummyUserIds } },
      ]
    });

    await User.deleteMany({ email: { $in: dummyEmails } });

    console.log("✅ Dummy data removed successfully");
  } catch (err) {
    console.error("❌ Remove dummy data error:", err.message);
  }
};

module.exports = { seedDummyData, removeDummyData };