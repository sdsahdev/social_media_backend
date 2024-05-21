const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Generate a JWT token for a user
const generateToken = (userId, username) => {
  console.log(process.env.JWT_SECRET);
  return jwt.sign({ userId, username }, process.env.JWT_SECRET, {
    expiresIn: "365d",
  });
};

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized - Missing token" });
  }
  console.log(authHeader, "===auth header === ");
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Invalid token format" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden - Invalid token" });
    }
    req.user = decoded; // Attach decoded user data to request object
    next();
  });
}

// Hash password using bcrypt
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare hashed password with plain password
const comparePasswords = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { generateToken, verifyToken, hashPassword, comparePasswords };
