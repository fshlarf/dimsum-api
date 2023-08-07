// const path = require("path");
// const fs = require("fs/promises");
const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { name } = req.body;
    const file = req.file;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    // check existing announcements
    try {
      const getExistingAnnouncements = await pgClientPool.query(
        "SELECT * FROM announcements"
      );
      if (getExistingAnnouncements.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Already reached 1 announcement limit" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error });
    }

    // upload announcement image
    let fileName = null;
    fileName = `${Date.now()}-${file.originalname}`;
    const destinationPath = path.join(
      process.cwd(),
      `public/images/announcement/`,
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
      return res.status(500).json({ error: "error saving announcement image" });
    }

    // create article
    try {
      let announcement;
      await pgClientPool.query(
        "INSERT INTO announcements (name, file_name) VALUES ($1, $2) RETURNING *",
        [name, fileName],
        (error, result) => {
          if (error) {
            return next(error);
          }

          announcement = result.rows[0];
          res.status(201);
          return res.json({
            message: `announcement with ID: ${announcement.id} is created`,
          });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
