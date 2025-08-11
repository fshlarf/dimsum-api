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

    // delete image from Cloudinary
    let imageUrl
    try {
      const getPartner = await pgClientPool.query(
        "SELECT * FROM partners WHERE id = $1",
        [id]
      )
      if (getPartner.rows.length === 0) {
        return res.status(404).json({ error: "partner not found" })
      }
      imageUrl = getPartner.rows[0].photo_filename
    } catch (error) {
      return next(error)
    }

    if (imageUrl) {
      const publicId = extractPublicId(imageUrl)
      if (publicId) {
        try {
          await deleteImage(publicId)
          console.log(`Deleted partner image from Cloudinary: ${publicId}`)
        } catch (error) {
          console.log("Failed to delete partner image from Cloudinary:", error)
          // Continue with partner deletion even if image deletion fails
        }
      }
    }

    // delete product
    try {
      await pgClientPool.query(
        "DELETE FROM partners WHERE id = $1",
        [id],
        (error) => {
          if (error) {
            return next(error)
          }
          res.status(201)
          return res.json({ message: `partner with ID: ${id} is deleted` })
        }
      )
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
