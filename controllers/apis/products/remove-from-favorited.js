module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    try {
      // edit product
      await pgClientPool.query(
        "UPDATE products SET is_favorited = $1 WHERE id = $2",
        [false, id],
        (error) => {
          if (error) {
            return next(error);
          }
        }
      );

      res.status(201);
      return res.json({
        message: `product with ID: ${id} is updated`,
      });
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
