const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { page, limit, search, categoryId } = req.query;
      const { user } = req.session;
      const baseUrl = process.env.BASE_URL_API;

      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const queryLimit = limit ? parseInt(limit) : 20;
      const queryPage = page ? parseInt(page) : 1;
      const offset = (queryPage - 1) * queryLimit;

      // get products
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM products WHERE ($1::text IS NULL OR LOWER(name) LIKE LOWER($1)) AND ($4::integer IS NULL OR category_id = $4) ORDER BY id ASC LIMIT $2::int OFFSET $3::int",
          [
            search ? `%${search}%` : null,
            queryLimit,
            offset,
            categoryId ? categoryId : null,
          ]
        );
        getList = result.rows.map((product) => {
          return {
            ...convertSnakeToCamelCase(product),
            imageLink: `${baseUrl}/api/bucket/images/products/${product.file_name}`,
          };
        });
      } catch (error) {
        return next(new Error(error));
      }

      for (let i = 0; i < getList.length; i++) {
        const product = getList[i];
        let variants;
        try {
          const getVariant = await pgClientPool.query(
            "SELECT * FROM product_variants WHERE product_id = $1",
            [product.id]
          );
          variants = getVariant.rows.map((variant) => {
            return convertSnakeToCamelCase(variant);
          });
          getList[i] = {
            ...getList[i],
            variants: variants,
          };
        } catch (error) {
          return next(new Error(error));
        }
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

      let data = getList;

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
