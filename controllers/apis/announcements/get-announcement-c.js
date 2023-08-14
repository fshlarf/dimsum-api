// import { convertSnakeToCamelCase } from "../../../helpers/utils";
const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      // get announcement
      let announcement;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM announcements ORDER BY id DESC LIMIT 1"
        );
        announcement = result.rows[0];
      } catch (error) {
        return next(new Error(error));
      }

      let data = convertSnakeToCamelCase(announcement);

      const ress = { data };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
