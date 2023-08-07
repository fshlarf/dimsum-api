// import { convertSnakeToCamelCase } from "../../../helpers/utils";
const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const { user } = req.session;

      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const queryLimit = limit ? parseInt(limit) : 20;
      const queryPage = page ? parseInt(page) : 1;
      const offset = (queryPage - 1) * queryLimit;

      // get user
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM users WHERE ($1::text IS NULL OR LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(phone) LIKE LOWER($1)) AND email != 'system@mail.com' LIMIT $2::int OFFSET $3::int",
          [search ? `%${search}%` : null, queryLimit, offset]
        );
        getList = result.rows;
      } catch (e) {
        return next(new Error(e));
      }

      // get total
      let total;
      try {
        const totalRes = await pgClientPool.query(
          "SELECT COUNT(*) FROM users WHERE ($1::text IS NULL OR LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(phone) LIKE LOWER($1)) AND email != 'system@mail.com'",
          [search ? `%${search}%` : null]
        );
        total = parseInt(totalRes.rows[0].count);
      } catch (error) {
        return next(new Error(error));
      }

      let data = [];
      getList.forEach((user) => {
        // if (user.email !== "system@mail.com") {
        data.push(convertSnakeToCamelCase(user));
        // }
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
