module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { name, isActive } = req.body;
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive is required" });
    }

    try {
      // edit categories
      await pgClientPool.query(
        "UPDATE categories SET name = $1, is_active = $2 WHERE id = $3",
        [name, isActive, id],
        (error) => {
          if (error) {
            return next(error);
          }
        }
      );

      res.status(201);
      return res.json({ message: `category with ID: ${id} is updated` });
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
