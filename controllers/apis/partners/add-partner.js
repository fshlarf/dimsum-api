const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { rewardId, name, phone, email, address, joinDate, testimony } =
      req.body;
    const file = req.file;
    const { user } = req.session;

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

    // upload profile image
    let fileName = null;
    fileName = `${Date.now()}-${file.originalname}`;
    const destinationPath = path.join(
      process.cwd(),
      `public/images/partners/`,
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
      return res.status(500).json({ error: "error saving profile image" });
    }

    try {
      let partner;
      // create partner
      await pgClientPool.query(
        "INSERT INTO partners (reward_id, name, phone_number, email, address, join_date, testimony, photo_filename) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [
          rewardId,
          name,
          phone,
          email,
          address,
          joinDate ? joinDate : null,
          testimony,
          fileName,
        ],
        (error, result) => {
          if (error) {
            console.log(error);
            return next(error);
          }
          partner = result.rows[0];
          res.status(201);
          return res.json({
            message: `partner with ID: ${partner.id} is created`,
          });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
