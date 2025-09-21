import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
 const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = {
      _id: decoded._id,
      email: decoded.email,
      userName: decoded.userName,
      fullName: decoded.fullName,
    };
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired, please login again" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    return res.status(500).json({ success: false, message: "Authentication failed" });
  }
};
