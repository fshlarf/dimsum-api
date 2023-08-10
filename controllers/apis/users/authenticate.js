const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// import jwt from "jsonwebtoken";

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { email, password } = req.body;
    const reqSessionId = req.session.id;

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "password is required" });
    }
    try {
      const data = await pgClientPool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (data.rows.length === 0) {
        return res.status(403).json({ error: "user email not found" });
      }
      const user = data.rows[0];

      if (!user.is_active) {
        return res.status(402).json({ error: "user is not active" });
      }
      const matches = bcrypt.compareSync(password, user.password);
      if (!matches) {
        return res.status(403).json({ error: "wrong password" });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isActive: user.is_active,
        sessionId: reqSessionId,
      };

      res.status(200);
      return res.json({ user: req.session.user });
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
