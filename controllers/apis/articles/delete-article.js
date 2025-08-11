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
      const getArticle = await pgClientPool.query(
        "SELECT * FROM articles WHERE id = $1",
        [id]
      )
      if (getArticle.rows.length === 0) {
        return res.status(404).json({ error: "Article not found" })
      }
      imageUrl = getArticle.rows[0].file_name
    } catch (error) {
      return next(error)
    }

    // delete image from Cloudinary
    if (imageUrl) {
      const publicId = extractPublicId(imageUrl)
      if (publicId) {
        try {
          await deleteImage(publicId)
          console.log(`Deleted article image from Cloudinary: ${publicId}`)
        } catch (error) {
          console.log("Failed to delete article image from Cloudinary:", error)
          // Continue with article deletion even if image deletion fails
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
            return next(error)
          }
          res.status(201)
          return res.json({ message: `article with ID: ${id} is deleted` })
        }
      )
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
