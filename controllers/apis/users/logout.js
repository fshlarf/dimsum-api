module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { user } = req.session;
      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      req.session.destroy();
      res.status(200);
      return res.json({ message: "logged out" });
    } catch (e) {
      res.locals.statusCode = 401;
      next(e);
    }
  };
};
