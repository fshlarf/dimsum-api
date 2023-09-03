const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { page, limit, search, categoryId, packaging } = req.query;
      const baseUrl = process.env.BASE_URL_API;

      const queryLimit = limit ? parseInt(limit) : 20;
      const queryPage = page ? parseInt(page) : 1;
      const offset = (queryPage - 1) * queryLimit;

      // get product variants
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT pv.*, p.name AS product_name, p.file_name AS product_file_name FROM product_variants pv LEFT JOIN products p ON p.id = pv.product_id WHERE ($1::text IS NULL OR LOWER(p.name) LIKE LOWER($1)) AND ($2::integer IS NULL OR p.category_id = $2) AND ($3::text IS NULL OR pv.packaging = $3) ORDER BY id ASC LIMIT $4::int OFFSET $5::int",
          [
            search ? `%${search}%` : null,
            categoryId ? categoryId : null,
            packaging ? packaging : null,
            queryLimit,
            offset,
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
          "SELECT COUNT(*) FROM product_variants pv LEFT JOIN products p ON p.id = pv.product_id WHERE ($1::text IS NULL OR LOWER(p.name) LIKE LOWER($1)) AND ($2::integer IS NULL OR p.category_id = $2) AND ($3::text IS NULL OR pv.packaging = $3)",
          [
            search ? `%${search}%` : null,
            categoryId ? categoryId : null,
            packaging ? packaging : null,
          ]
        );
        total = parseInt(totalRes.rows[0].count);
      } catch (error) {
        return next(new Error(error));
      }

      let data = getList.map((variant) => {
        return {
          ...convertSnakeToCamelCase(variant),
          imageLink: `${baseUrl}/api/bucket/images/products/${variant.product_file_name}`,
        };
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
