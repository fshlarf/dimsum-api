const { uploadImage } = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const { name, link } = req.body
    const file = req.file

    if (!user) {
      return res.status(401).json({ error: "unauthorized" })
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" })
    }
    if (!link) {
      return res.status(400).json({ error: "link is required" })
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" })
    }

    // check existing announcements
    try {
      const getExistingAnnouncements = await pgClientPool.query(
        "SELECT * FROM announcements"
      )
      if (getExistingAnnouncements.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Already reached 1 announcement limit" })
      }
    } catch (error) {
      console.log(error)
      return res.status(500).json({ error: error })
    }

    // upload announcement image to Cloudinary
    let imageUrl = null
    try {
      const uploadResult = await uploadImage(
        file.buffer,
        "dimsum/announcements",
        `announcement_${Date.now()}`
      )
      imageUrl = uploadResult.secure_url
      console.log(`Uploaded announcement image: ${uploadResult.public_id}`)
    } catch (error) {
      console.log("Error uploading announcement image:", error)
      return res
        .status(500)
        .json({ error: "Error uploading announcement image" })
    }

    // create article
    try {
      let announcement
      await pgClientPool.query(
        "INSERT INTO announcements (name, link, file_name) VALUES ($1, $2, $3) RETURNING *",
        [name, link, imageUrl],
        (error, result) => {
          if (error) {
            return next(error)
          }

          announcement = result.rows[0]
          res.status(201)
          return res.json({
            message: `announcement with ID: ${announcement.id} is created`,
          })
        }
      )
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
