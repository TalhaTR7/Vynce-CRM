import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ msg: "No token, access denied" });

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET)
    throw new Error("JWT_SECRET is not set");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ msg: "Token expired" });
    return res.status(401).json({ msg: "Token invalid" });
  }
};

export default authMiddleware;
