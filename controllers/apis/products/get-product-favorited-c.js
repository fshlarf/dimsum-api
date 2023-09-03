const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const baseUrl = process.env.BASE_URL_API;

      // get products
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM products WHERE is_favorited = $1 ORDER BY id ASC",
          [true]
        );
        getList = result.rows;
      } catch (error) {
        return next(new Error(error));
      }

      let data = getList.map((product) => {
        return {
          ...convertSnakeToCamelCase(product),
          imageLink: `${baseUrl}/api/bucket/images/products/${product.file_name}`,
        };
      });

      const ress = { data };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
