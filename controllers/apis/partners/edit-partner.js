const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;
    const { name, rewardId, email, phone, address, joinDate, testimony } =
      req.body;
    const file = req.file;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!rewardId) {
      return res.status(400).json({ error: "rewardId is required" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!address) {
      return res.status(400).json({ error: "address is required" });
    }
    if (!testimony) {
      return res.status(400).json({ error: "testimony is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    let partner;
    try {
      const getPartner = await pgClientPool.query(
        "SELECT * FROM partners WHERE id = $1",
        [id]
      );
      if (getPartner.rows.length == 0) {
        return res.status(404).json({ error: "partner not found" });
      }
      partner = getPartner.rows[0];
    } catch (error) {
      return next(error);
    }

    let updatedFileName = partner.photo_filename;
    const existingImageFileName = partner.photo_filename;
    const fileName = file.originalname;

    if (existingImageFileName && existingImageFileName !== fileName) {
      // delete existing image
      const filePath = path.join(
        process.cwd(),
        `public/images/partners`,
        existingImageFileName
      );
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.log("failed to delete file: " + error);
        if (error.code !== "ENOENT") {
          return res
            .status(500)
            .json({ error: `Error deleting partner profile image: ${error}` });
        }
      }

      // upload new image
      updatedFileName = `${Date.now()}-${file.originalname}`;
      const destinationPath = path.join(
        process.cwd(),
        `public/images/partners/`,
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
        return res
          .status(500)
          .json({ error: "error saving partner profile image" });
      }
    }

    try {
      await pgClientPool.query(
        "UPDATE partners SET name = $1, reward_id = $2, email = $3, phone_number = $4, address = $5, join_date = $6, testimony = $7, photo_filename = $8 WHERE id = $9",
        [
          name,
          rewardId,
          email,
          phone,
          address,
          joinDate,
          testimony,
          updatedFileName,
          id,
        ],
        (error, result) => {
          if (error) {
            return next(error);
          }
          partner = result.rows[0];
          res.status(201);
          return res.json({ message: `partner with ID: ${id} is updated` });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
