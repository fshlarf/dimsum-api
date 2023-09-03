module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { sequence } = req.body;
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!sequence) {
      return res.status(400).json({ error: "sequence is required" });
    }

    try {
      // edit reward
      await pgClientPool.query(
        "UPDATE rewards SET sequence = $1 WHERE id = $2",
        [sequence, id],
        (error) => {
          if (error) {
            return next(error);
          }
        }
      );

      res.status(201);
      return res.json({ message: `reward sequence with ID: ${id} is updated` });
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
