const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const baseUrl = process.env.BASE_URL_API;

      const queryLimit = limit ? parseInt(limit) : 20;
      const queryPage = page ? parseInt(page) : 1;
      const offset = (queryPage - 1) * queryLimit;

      // get partners
      let getList;
      try {
        const result = await pgClientPool.query(
          "SELECT p.*, r.name AS reward_name FROM partners p LEFT JOIN rewards r ON r.id = p.reward_id WHERE ($1::text IS NULL OR LOWER(p.name) LIKE LOWER($1) OR LOWER(p.email) LIKE LOWER($1) OR LOWER(p.phone_number) LIKE LOWER($1)) ORDER BY p.id DESC LIMIT $2::int OFFSET $3::int",
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
          "SELECT COUNT(*) FROM partners WHERE ($1::text IS NULL OR LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(phone_number) LIKE LOWER($1))",
          [search ? `%${search}%` : null]
        );
        total = parseInt(totalRes.rows[0].count);
      } catch (error) {
        return next(new Error(error));
      }

      let data = getList.map((partner) => {
        return {
          ...convertSnakeToCamelCase(partner),
          profileImage: `${baseUrl}/api/bucket/images/partners/${partner.photo_filename}`,
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
