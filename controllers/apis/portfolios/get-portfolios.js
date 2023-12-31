const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { user } = req.session;

      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      // get portfolios
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM portfolios ORDER BY sequence ASC"
        );
        getList = result.rows;
      } catch (error) {
        return next(new Error(error));
      }

      // get total
      let total;
      try {
        const totalRes = await pgClientPool.query(
          "SELECT COUNT(*) FROM portfolios"
        );
        total = parseInt(totalRes.rows[0].count);
      } catch (error) {
        return next(new Error(error));
      }

      let data = getList.map((portfolio) => {
        return convertSnakeToCamelCase(portfolio);
      });

      const pagination = {
        totalResults: total,
      };

      const ress = { data, pagination };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
