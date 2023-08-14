// import { convertSnakeToCamelCase } from "../../../helpers/utils";
const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      // get article
      let article;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM articles WHERE id = $1",
          [id]
        );
        if (result.rows.length == 0) {
          return res.status(404).json({ error: "article not found" });
        }
        article = result.rows[0];
      } catch (error) {
        return next(new Error(error));
      }

      let data = convertSnakeToCamelCase(article);

      const ress = { data };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
