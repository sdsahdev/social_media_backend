const router = require("express").Router();
const { generateToken } = require("../middleware/auth");
const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
// register
router.post("/register", async (req, res) => {
  try {
    // Input validation
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required." });
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }
    const existingMobileUser = await User.findOne({ mobile: req.body.mobile });
    if (existingMobileUser) {
      return res.status(400).json({ message: "Mobile number already exists." });
    }
    const existingUserName = await User.findOne({
      username: req.body.username,
    });
    if (existingUserName) {
      return res.status(400).json({ message: "Username already exists." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      mobile: req.body.mobile,
      gender: req.body.gender,
      password: hashedPassword,
    });

    // Save the new user
    await newUser.save();

    // Generate and return JWT token upon successful registration
    const token = generateToken(newUser._id, newUser.username);

    res.status(200).json({
      message: "User created successfully.",
      user: newUser,
      status: true,
      token: token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    console.log(req.body, "===body");
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${req.body.email}$`, "i") },
    });
    console.log(user, "===user===");
    if (!user) {
      res.status(200).json({ status: false, message: "user not found" });
    } else {
      const validePassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (validePassword) {
        const token = generateToken(user._id, user.username);
        res.status(200).json({
          status: true,
          message: "user found successfully",
          data: user,
          token: token,
        });
      } else {
        res.status(200).json({ status: false, message: "wrong password" });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});
router.post("/refresh-token", (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is missing" });
  }
  // Verify refresh token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Refresh token is invalid" });
    }
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  });
});

router.post("/send-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email) {
    return res.status(400).send("Email is required");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code for FlixPost",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Hello,</h2>
        <p>Your One-Time Password (OTP) for verifying your email address is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #007BFF;">${otp}</p>
        <p>Thank you for signing up with <strong>FlixPost</strong>, the ultimate social media platform to share and connect with your friends.</p>
        <p>Please enter this code in the app to complete your registration.</p>
        <p>If you did not initiate this request, please ignore this email.</p>
        <p>Thank you for joining <strong>FlixPost</strong>! We're excited to have you on board.</p>
        <br>
        <p>Best regards,</p>
        <p>The FlixPost Team</p>
        <br>
        <hr>
        <p style="font-size: 12px; color: #777;">If you have any questions, feel free to contact our support team at support@flixpost.com.</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json("Error sending email: " + error.message);
    }
    res.status(200).json({ message: "OTP sent successfully" });
  });
});

module.exports = router;
