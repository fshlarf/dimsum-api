const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { search } = req.query;

      // get categories
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM categories WHERE ($1::text IS NULL OR LOWER(name) LIKE LOWER($1))",
          [search ? `%${search}%` : null]
        );
        getList = result.rows;
      } catch (e) {
        return next(new Error(e));
      }

      // get total
      let total;
      try {
        const totalRes = await pgClientPool.query(
          "SELECT COUNT(*) FROM categories WHERE ($1::text IS NULL OR LOWER(name) LIKE LOWER($1))",
          [search ? `%${search}%` : null]
        );
        total = parseInt(totalRes.rows[0].count);
      } catch (error) {
        return next(new Error(error));
      }

      let data = [];
      getList.forEach((category) => {
        data.push(convertSnakeToCamelCase(category));
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
