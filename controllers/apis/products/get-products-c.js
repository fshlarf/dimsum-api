// import { convertSnakeToCamelCase } from "../../../helpers/utils";
const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { page, limit, search, categoryId } = req.query;

      const queryLimit = limit ? parseInt(limit) : 20;
      const queryPage = page ? parseInt(page) : 1;
      const offset = (queryPage - 1) * queryLimit;

      // get products
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM products WHERE ($1::text IS NULL OR LOWER(name) LIKE LOWER($1)) AND ($4::integer IS NULL OR category_id = $4) LIMIT $2::int OFFSET $3::int",
          [
            search ? `%${search}%` : null,
            queryLimit,
            offset,
            categoryId ? categoryId : null,
          ]
        );
        getList = result.rows;
      } catch (error) {
        return next(new Error(error));
      }

      // get total
      let total;
      try {
        const totalRes = await pgClientPool.query(
          "SELECT COUNT(*) FROM products WHERE ($1::text IS NULL OR LOWER(name) LIKE LOWER($1)) AND ($2::integer IS NULL OR category_id = $2)",
          [search ? `%${search}%` : null, categoryId ? categoryId : null]
        );
        total = parseInt(totalRes.rows[0].count);
      } catch (error) {
        return next(new Error(error));
      }

      let data = getList.map((product) => {
        return convertSnakeToCamelCase(product);
      });

      const pagination = {
        currentPage: queryPage,
        perPage: queryLimit,
        totalResults: total,
        totalPages: Math.ceil(total / queryLimit),
      };

      const ress = { data, pagination };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
