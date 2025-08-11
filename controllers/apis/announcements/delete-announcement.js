const { deleteImage, extractPublicId } = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const { id } = req.params

    if (!user) {
      return res.status(401).json({ error: "unauthorized" })
    }
    if (!id) {
      return res.status(400).json({ error: "id is required" })
    }

    let imageUrl
    try {
      const getAnnouncement = await pgClientPool.query(
        "SELECT * FROM announcements WHERE id = $1",
        [id]
      )
      if (getAnnouncement.rows.length === 0) {
        return res.status(404).json({ error: "Announcement not found" })
      }
      imageUrl = getAnnouncement.rows[0].file_name
    } catch (error) {
      return next(error)
    }

    // delete image from Cloudinary
    if (imageUrl) {
      const publicId = extractPublicId(imageUrl)
      if (publicId) {
        try {
          await deleteImage(publicId)
          console.log(`Deleted announcement image from Cloudinary: ${publicId}`)
        } catch (error) {
          console.log(
            "Failed to delete announcement image from Cloudinary:",
            error
          )
          // Continue with announcement deletion even if image deletion fails
        }
      }
    }

    // delete announcement
    try {
      await pgClientPool.query(
        "DELETE FROM announcements WHERE id = $1",
        [id],
        (error) => {
          if (error) {
            return next(error)
          }
          res.status(201)
          return res.json({
            message: `announcement with ID: ${id} is deleted`,
          })
        }
      )
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
