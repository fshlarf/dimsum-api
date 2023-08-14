// import { convertSnakeToCamelCase } from "../../../helpers/utils";
const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      // get product
      let product;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM products WHERE id = $1",
          [id]
        );
        if (result.rows.length == 0) {
          return res.status(404).json({ error: "product not found" });
        }
        product = result.rows[0];
      } catch (error) {
        return next(new Error(error));
      }

      let data = convertSnakeToCamelCase(product);

      const ress = { data };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
