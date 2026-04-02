const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your TaskFlow OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #6366f1;">TaskFlow Login</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 8px; color: #6366f1; font-size: 36px;">${otp}</h1>
        <p style="color: #888;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #888; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOTPEmail };