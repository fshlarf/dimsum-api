const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { user } = req.session;
      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      // get user
      let userData;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM users WHERE id = $1",
          [user.id]
        );
        if (result.rows.length > 0) {
          userData = result.rows[0];
        } else {
          return res.status(401).json({ error: "user not found" });
        }
      } catch (e) {
        return next(new Error(e));
      }

      if (!userData.is_active) {
        return res.status(401).json({ error: "unauthorized" });
      }

      let data = convertSnakeToCamelCase(userData);

      const ress = { data };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
