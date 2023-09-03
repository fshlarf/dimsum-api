const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const baseUrl = process.env.BASE_URL_API;
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      // get product
      let product;
      try {
        const result = await pgClientPool.query(
          "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = $1",
          [id]
        );
        if (result.rows.length == 0) {
          return res.status(404).json({ error: "product not found" });
        }
        product = result.rows[0];
      } catch (error) {
        return next(new Error(error));
      }

      // get product variants
      let variants;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM product_variants WHERE product_id = $1",
          [id]
        );
        if (result.rows.length == 0) {
          return res.status(404).json({ error: "product variant not found" });
        }
        variants = result.rows.map((variant) => {
          return convertSnakeToCamelCase(variant);
        });
      } catch (error) {
        return next(new Error(error));
      }

      let data = {
        ...convertSnakeToCamelCase(product),
        imageLink: `${baseUrl}/api/bucket/images/products/${product.file_name}`,
        variants: variants,
      };

      const ress = { data };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
