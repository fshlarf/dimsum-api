const bcrypt = require("bcrypt");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { name, phone, email, password } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!phone) {
      return res.status(400).json({ error: "phone is required" });
    }
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "password is required" });
    }

    try {
      let user;
      const hashedPassword = bcrypt.hashSync(password, 10);
      // create user
      await pgClientPool.query(
        "INSERT INTO users (name, phone, email, password, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, phone, email, hashedPassword, true],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402;
              return next(new Error(`${email} is already exists`));
            } else {
              return next(error);
            }
          }

          user = result.rows[0];
          res.status(201);
          return res.json({ message: `user with ID: ${user.id} is created` });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
