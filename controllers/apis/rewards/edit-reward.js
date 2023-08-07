module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { name, description } = req.body;
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!description) {
      return res.status(400).json({ error: "description is required" });
    }

    try {
      // edit reward
      await pgClientPool.query(
        "UPDATE rewards SET name = $1, description = $2 WHERE id = $3",
        [name, description, id],
        (error) => {
          if (error) {
            return next(error);
          }
        }
      );

      res.status(201);
      return res.json({ message: `reward with ID: ${id} is updated` });
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
