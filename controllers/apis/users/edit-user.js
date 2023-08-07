module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { name, phone, isActive, email } = req.body;
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!phone) {
      return res.status(400).json({ error: "phone is required" });
    }
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive is required" });
    }

    try {
      // edit user
      await pgClientPool.query(
        "UPDATE users SET name = $1, phone = $2, is_active = $3, email = $4 WHERE id = $5",
        [name, phone, isActive, email, id],
        (error) => {
          if (error) {
            return next(error);
          }
        }
      );

      res.status(201);
      return res.json({ message: `user with ID: ${id} is updated` });
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
