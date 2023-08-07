const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { name, value } = req.body;
    const file = req.file;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!value) {
      return res.status(400).json({ error: "value is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    // upload portfolio icon
    let fileName = null;
    fileName = `${Date.now()}-${file.originalname}`;
    const destinationPath = path.join(
      process.cwd(),
      `public/images/portfolio/`,
      fileName
    );
    // create the directory
    const directory = path.dirname(destinationPath);
    await fs.mkdir(directory, { recursive: true });
    // Move the file to the directory
    try {
      await fs.writeFile(destinationPath, file.buffer);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "error saving portfolio icon" });
    }

    // create portfolio
    try {
      let portfolio;
      await pgClientPool.query(
        "INSERT INTO portfolios (name, icon_name, value, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, fileName, value, true],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402;
              return next(new Error(`${name} is already exists`));
            } else {
              return next(error);
            }
          }

          portfolio = result.rows[0];
          res.status(201);
          return res.json({
            message: `portfolio with ID: ${portfolio.id} is created`,
          });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
