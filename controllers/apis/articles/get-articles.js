const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const { user } = req.session;
      const baseUrl = process.env.BASE_URL_API;

      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }

      const queryLimit = limit ? parseInt(limit) : 20;
      const queryPage = page ? parseInt(page) : 1;
      const offset = (queryPage - 1) * queryLimit;

      // get articles
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM articles WHERE ($1::text IS NULL OR LOWER(title) LIKE LOWER($1)) ORDER BY id DESC LIMIT $2::int OFFSET $3::int",
          [search ? `%${search}%` : null, queryLimit, offset]
        );
        getList = result.rows;
      } catch (error) {
        return next(new Error(error));
      }

      // get total
      let total;
      try {
        const totalRes = await pgClientPool.query(
          "SELECT COUNT(*) FROM articles WHERE ($1::text IS NULL OR LOWER(title) LIKE LOWER($1))",
          [search ? `%${search}%` : null]
        );
        total = parseInt(totalRes.rows[0].count);
      } catch (error) {
        return next(new Error(error));
      }

      let data = getList.map((article) => {
        return {
          ...convertSnakeToCamelCase(article),
          imageLink: `${baseUrl}/api/bucket/images/articles/${article.file_name}`,
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
