const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");

// @POST /api/2fa/setup — generate secret + QR code
const setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `TaskFlow (${req.user.email})`,
      length: 20,
    });

    // Save secret temporarily (not enabled yet)
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: secret.base32,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/2fa/verify-setup — verify OTP and enable 2FA
const verifyAndEnable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid code. Try again." });
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.json({ message: "2FA enabled successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/2fa/disable — disable 2FA
const disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid code" });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({ message: "2FA disabled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/2fa/validate — validate 2FA on login
const validate2FA = async (req, res) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA not enabled for this user" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid 2FA code" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/2fa/sessions — get active sessions
const getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("sessions");
    res.json(user.sessions || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/2fa/sessions/:sessionId — logout specific session
const deleteSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.sessions = user.sessions.filter(
      s => s._id.toString() !== req.params.sessionId
    );
    await user.save();
    res.json({ message: "Session removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/2fa/sessions — logout all other sessions
const deleteAllSessions = async (req, res) => {
  try {
    const currentToken = req.headers.authorization.split(" ")[1];
    const user = await User.findById(req.user._id);
    user.sessions = user.sessions.filter(s => s.token === currentToken);
    await user.save();
    res.json({ message: "All other sessions removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  validate2FA,
  getSessions,
  deleteSession,
  deleteAllSessions,
};