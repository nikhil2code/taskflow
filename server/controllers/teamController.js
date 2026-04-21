const Team = require("../models/teamModel");
const User = require("../models/userModel");

// @GET /api/admin/users
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// @PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = role;
  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
};

// @PATCH /api/admin/users/:id/deactivate
const deactivateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isActive = false;
  await user.save();
  res.json({ message: "User deactivated" });
};

// @PATCH /api/admin/users/:id/activate
const activateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isActive = true;
  await user.save();
  res.json({ message: "User activated" });
};

module.exports = { getAllUsers, updateUserRole, deactivateUser, activateUser };
// @POST /api/teams
const createTeam = async (req, res) => {
  const { name, description, memberIds } = req.body;

  const team = await Team.create({
    name,
    description,
    createdBy: req.user._id,
    members: memberIds || [],
  });

  const populated = await team.populate("members", "name email role");
  res.status(201).json(populated);
};

// @GET /api/teams
const getTeams = async (req, res) => {
  const teams = await Team.find()
    .populate("members", "name email role")
    .populate("createdBy", "name email");
  res.json(teams);
};

// @GET /api/teams/:id
const getTeamById = async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate("members", "name email role")
    .populate("createdBy", "name email");
  if (!team) return res.status(404).json({ message: "Team not found" });
  res.json(team);
};

// @PATCH /api/teams/:id
const updateTeam = async (req, res) => {
  const { name, description, memberIds } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "Team not found" });

  if (name) team.name = name;
  if (description) team.description = description;
  if (memberIds) team.members = memberIds;

  await team.save();
  const populated = await team.populate("members", "name email role");
  res.json(populated);
};

// @DELETE /api/teams/:id
const deleteTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "Team not found" });
  await team.deleteOne();
  res.json({ message: "Team deleted" });
};

module.exports = { createTeam, getTeams, getTeamById, updateTeam, deleteTeam };