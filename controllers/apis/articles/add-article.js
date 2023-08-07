const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { title, content } = req.body;
    const file = req.file;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    // upload article image
    let fileName = null;
    fileName = `${Date.now()}-${file.originalname}`;
    const destinationPath = path.join(
      process.cwd(),
      `public/images/articles/`,
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
      return res.status(500).json({ error: "error saving article image" });
    }

    // create article
    try {
      let article;
      await pgClientPool.query(
        "INSERT INTO articles (title, content, file_name, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, content, fileName, true],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402;
              return next(new Error(`${title} is already exists`));
            } else {
              return next(error);
            }
          }

          article = result.rows[0];
          res.status(201);
          return res.json({
            message: `article with ID: ${article.id} is created`,
          });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
