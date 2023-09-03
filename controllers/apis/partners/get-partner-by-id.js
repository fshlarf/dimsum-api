const convertSnakeToCamelCase = require("../../../helpers/utils");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    try {
      const { user } = req.session;
      const { id } = req.params;
      const baseUrl = process.env.BASE_URL_API;

      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
      }
      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      // get partner
      let partner;
      try {
        const result = await pgClientPool.query(
          "SELECT * FROM partners WHERE id = $1",
          [id]
        );
        if (result.rows.length == 0) {
          return res.status(404).json({ error: "partner not found" });
        }
        partner = result.rows[0];
      } catch (error) {
        return next(new Error(error));
      }

      let data = {
        ...convertSnakeToCamelCase(partner),
        imageLink: `${baseUrl}/api/bucket/images/partners/${partner.photo_filename}`,
      };

      const ress = { data };
      res.status(200).json(ress);
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
