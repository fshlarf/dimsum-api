const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;
    const { name, value, isActive } = req.body;
    const file = req.file;
    let isActiveBool;
    try {
      isActiveBool = await JSON.parse(isActive);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: "isActive must be a boolean" });
    }

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!value) {
      return res.status(400).json({ error: "value is required" });
    }
    if (typeof isActiveBool !== "boolean") {
      return res.status(400).json({ error: "isActive is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    let portfolio;
    try {
      const getPortfolio = await pgClientPool.query(
        "SELECT * FROM portfolios WHERE id = $1",
        [id]
      );
      if (getPortfolio.rows.length == 0) {
        return res.status(404).json({ error: "portfolio not found" });
      }
      portfolio = getPortfolio.rows[0];
    } catch (error) {
      return next(error);
    }

    let updatedFileName = portfolio.icon_name;
    const existingImageFileName = portfolio.icon_name;
    const fileName = file.originalname;

    if (existingImageFileName !== fileName) {
      // delete existing image
      const filePath = path.join(
        process.cwd(),
        `public/images/portfolio`,
        existingImageFileName
      );
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.log("failed to delete file: " + error);
        if (error.code !== "ENOENT") {
          return res
            .status(500)
            .json({ error: `Error deleting portfolio icon: ${error}` });
        }
      }

      // upload new image
      updatedFileName = `${Date.now()}-${file.originalname}`;
      const destinationPath = path.join(
        process.cwd(),
        `public/images/portfolio/`,
        updatedFileName
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
    }

    try {
      await pgClientPool.query(
        "UPDATE portfolios SET name = $1, value = $2, is_active = $3, icon_name = $4 WHERE id = $5",
        [name, value, isActive, updatedFileName, id],
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
          return res.json({ message: `portfolio with ID: ${id} is updated` });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
