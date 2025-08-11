const {
  uploadImage,
  deleteImage,
  extractPublicId,
} = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const { id } = req.params
    const { title, content, isActive } = req.body
    const file = req.file
    let isActiveBool
    try {
      isActiveBool = await JSON.parse(isActive)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ error: "isActive must be a boolean" })
    }

    if (!user) {
      return res.status(401).json({ error: "unauthorized" })
    }
    if (!title) {
      return res.status(400).json({ error: "title is required" })
    }
    if (!content) {
      return res.status(400).json({ error: "content is required" })
    }
    if (typeof isActiveBool !== "boolean") {
      return res.status(400).json({ error: "isActive is required" })
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" })
    }

    let article
    try {
      const getArticle = await pgClientPool.query(
        "SELECT * FROM articles WHERE id = $1",
        [id]
      )
      if (getArticle.rows.length == 0) {
        return res.status(404).json({ error: "article not found" })
      }
      article = getArticle.rows[0]
    } catch (error) {
      return next(error)
    }

    let updatedImageUrl = article.file_name // This will now store the Cloudinary URL
    const existingImageUrl = article.file_name

    // Always upload new image to Cloudinary when file is provided
    try {
      // Delete existing image from Cloudinary if it exists
      if (existingImageUrl) {
        const publicId = extractPublicId(existingImageUrl)
        if (publicId) {
          try {
            await deleteImage(publicId)
            console.log(`Deleted existing article image: ${publicId}`)
          } catch (error) {
            console.log(
              `Failed to delete existing article image: ${publicId}`,
              error
            )
            // Continue with upload even if deletion fails
          }
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImage(
        file.buffer,
        "dimsum/articles",
        `article_${id}_${Date.now()}`
      )

      updatedImageUrl = uploadResult.secure_url
      console.log(`Uploaded new article image: ${uploadResult.public_id}`)
    } catch (error) {
      console.log("Error handling article image upload:", error)
      return res.status(500).json({ error: "Error processing article image" })
    }

    try {
      await pgClientPool.query(
        "UPDATE articles SET title = $1, content = $2, file_name = $3, is_active = $4 WHERE id = $5",
        [title, content, updatedImageUrl, isActive, id],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402
              return next(new Error(`${title} is already exists`))
            } else {
              return next(error)
            }
          }

          product = result.rows[0]
          res.status(201)
          return res.json({ message: `article with ID: ${id} is updated` })
        }
      )
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
