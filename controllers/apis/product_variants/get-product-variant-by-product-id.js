const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { productId } = req.params;
      const { user } = req.session;
      const baseUrl = process.env.BASE_URL_API;

      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }
      if (!productId) {
        return res.status(400).json({ error: "productId is required" });
      }

      // get product
      let product;
      try {
        const getProduct = await pgClientPool.query(
          "SELECT * FROM products WHERE id = $1",
          [productId]
        );
        if (getProduct.rows.length == 0) {
          return res.status(404).json({ error: "product not found" });
        }
        product = {
          ...convertSnakeToCamelCase(getProduct.rows[0]),
          imageLink: `${baseUrl}/api/bucket/images/products/${getProduct.rows[0].file_name}`,
        };
      } catch (error) {
        return next(new Error(error));
      }

      //   get variants
      let variants;
      try {
        const getVariants = await pgClientPool.query(
          "SELECT * FROM product_variants WHERE product_id = $1",
          [productId]
        );
        variants = getVariants.rows.map((variant) =>
          convertSnakeToCamelCase(variant)
        );
      } catch (error) {
        return next(new Error(error));
      }

      let data = {
        ...product,
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
