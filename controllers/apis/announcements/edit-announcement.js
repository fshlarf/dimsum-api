const {
  uploadImage,
  deleteImage,
  extractPublicId,
} = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const { id } = req.params
    const { name, link, isActive } = req.body
    const file = req.file
    let active = isActive
    if (typeof isActive !== "boolean") {
      active = true
    }

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

    let announcement
    try {
      const getAnnouncement = await pgClientPool.query(
        "SELECT * FROM announcements WHERE id = $1",
        [id]
      )
      if (getAnnouncement.rows.length == 0) {
        return res.status(404).json({ error: "announcement not found" })
      }
      announcement = getAnnouncement.rows[0]
    } catch (error) {
      return next(error)
    }

    let updatedImageUrl = announcement.file_name // This will now store the Cloudinary URL
    const existingImageUrl = announcement.file_name

    // Always upload new image to Cloudinary when file is provided
    try {
      // Delete existing image from Cloudinary if it exists
      if (existingImageUrl) {
        const publicId = extractPublicId(existingImageUrl)
        if (publicId) {
          try {
            await deleteImage(publicId)
            console.log(`Deleted existing announcement image: ${publicId}`)
          } catch (error) {
            console.log(
              `Failed to delete existing announcement image: ${publicId}`,
              error
            )
            // Continue with upload even if deletion fails
          }
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImage(
        file.buffer,
        "dimsum/announcements",
        `announcement_${id}_${Date.now()}`
      )

      updatedImageUrl = uploadResult.secure_url
      console.log(`Uploaded new announcement image: ${uploadResult.public_id}`)
    } catch (error) {
      console.log("Error handling announcement image upload:", error)
      return res
        .status(500)
        .json({ error: "Error processing announcement image" })
    }

    try {
      await pgClientPool.query(
        "UPDATE announcements SET name = $1, link = $2, file_name = $3, is_active = $4 WHERE id = $5",
        [name, link, updatedImageUrl, active, id],
        (error, result) => {
          if (error) {
            return next(error)
          }
          announcement = result.rows[0]
        }
      )

      res.status(201)
      return res.json({ message: `announcement with ID: ${id} is updated` })
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
