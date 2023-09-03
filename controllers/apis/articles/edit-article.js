const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;
    const { title, content, isActive } = req.body;
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
    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }
    if (typeof isActiveBool !== "boolean") {
      return res.status(400).json({ error: "isActive is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    let article;
    try {
      const getArticle = await pgClientPool.query(
        "SELECT * FROM articles WHERE id = $1",
        [id]
      );
      if (getArticle.rows.length == 0) {
        return res.status(404).json({ error: "article not found" });
      }
      article = getArticle.rows[0];
    } catch (error) {
      return next(error);
    }

    let updatedFileName = article.file_name;
    const existingImageFileName = article.file_name;
    const fileName = file.originalname;

    if (existingImageFileName !== fileName) {
      // delete existing image
      const filePath = path.join(
        process.cwd(),
        `public/images/articles`,
        existingImageFileName
      );
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.log("failed to delete file: " + error);
        if (error.code !== "ENOENT") {
          return res
            .status(500)
            .json({ error: `Error deleting article image: ${error}` });
        }
      }

      // upload new image
      updatedFileName = `${Date.now()}-${file.originalname}`;
      const destinationPath = path.join(
        process.cwd(),
        `public/images/articles/`,
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
        return res.status(500).json({ error: "error saving article image" });
      }
    }

    try {
      await pgClientPool.query(
        "UPDATE articles SET title = $1, content = $2, file_name = $3, is_active = $4 WHERE id = $5",
        [title, content, updatedFileName, isActive, id],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402;
              return next(new Error(`${title} is already exists`));
            } else {
              return next(error);
            }
          }

          product = result.rows[0];
          res.status(201);
          return res.json({ message: `article with ID: ${id} is updated` });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
