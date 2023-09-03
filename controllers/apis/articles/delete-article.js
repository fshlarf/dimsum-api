const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    let fileName;
    try {
      const getArticle = await pgClientPool.query(
        "SELECT * FROM articles WHERE id = $1",
        [id]
      );
      if (getArticle.rows.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }
      fileName = getArticle.rows[0].file_name;
    } catch (error) {
      return next(error);
    }

    // delete image file
    if (fileName) {
      const filePath = path.join(
        process.cwd(),
        `public/images/articles`,
        fileName
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
    }

    // delete article
    try {
      await pgClientPool.query(
        "DELETE FROM articles WHERE id = $1",
        [id],
        (error) => {
          if (error) {
            return next(error);
          }
          res.status(201);
          return res.json({ message: `article with ID: ${id} is deleted` });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
