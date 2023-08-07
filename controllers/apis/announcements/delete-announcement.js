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
      const getAnnouncement = await pgClientPool.query(
        "SELECT * FROM announcements WHERE id = $1",
        [id]
      );
      if (getAnnouncement.rows.length === 0) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      fileName = getAnnouncement.rows[0].file_name;
    } catch (error) {
      return next(error);
    }

    // delete image file
    let filePath;
    if (fileName) {
      filePath = path.join(
        process.cwd(),
        `public/images/announcement`,
        fileName
      );
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.log("failed to delete file: " + error);
        return res.status(500).json({
          error: `Error deleting announcement image: ${error}`,
        });
      }
    }

    // delete announcement
    try {
      await pgClientPool.query(
        "DELETE FROM announcements WHERE id = $1",
        [id],
        (error) => {
          if (error) {
            return next(error);
          }
          res.status(201);
          return res.json({
            message: `announcement with ID: ${id} is deleted`,
          });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
