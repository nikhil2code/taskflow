const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp, resetURL = null, name = "") => {
  let subject, html;

  if (resetURL) {
    subject = "TaskFlow — Reset your password";
    html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#6366f1">Reset your password</h2>
        <p>Hi ${name}, click the button below to reset your TaskFlow password.</p>
        <a href="${resetURL}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Reset Password
        </a>
        <p style="color:#888">This link expires in <strong>15 minutes</strong>.</p>
        <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
        <p style="color:#aaa;font-size:11px">Or copy this link: ${resetURL}</p>
      </div>
    `;
  } else {
    subject = "Your TaskFlow OTP Code";
    html = `
      <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#6366f1">TaskFlow Login</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing:8px;color:#6366f1;font-size:36px">${otp}</h1>
        <p style="color:#888">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `;
  }

  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};

module.exports = { sendOTPEmail };