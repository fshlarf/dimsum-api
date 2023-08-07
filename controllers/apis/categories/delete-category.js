module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    // delete category
    try {
      await pgClientPool.query(
        "DELETE FROM categories WHERE id = $1",
        [id],
        (error) => {
          if (error) {
            return next(error);
          }
        }
      );

      res.status(201);
      return res.json({ message: `category with ID: ${reward.id} is deleted` });
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
