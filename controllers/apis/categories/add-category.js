module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { name, isActive } = req.body;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive is required" });
    }

    // create category
    try {
      let category;
      await pgClientPool.query(
        "INSERT INTO categories (name, is_active) VALUES ($1, $2) RETURNING *",
        [name, true],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402;
              return next(new Error(`${name} is already exists`));
            } else {
              return next(error);
            }
          }

          category = result.rows[0];
          res.status(201);
          return res.json({
            message: `category with ID: ${category.id} is created`,
          });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
