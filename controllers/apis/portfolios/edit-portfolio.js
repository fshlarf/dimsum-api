const {
  uploadImage,
  deleteImage,
  extractPublicId,
} = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const { id } = req.params
    const { name, value, isActive } = req.body
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
    if (!name) {
      return res.status(400).json({ error: "name is required" })
    }
    if (!value) {
      return res.status(400).json({ error: "value is required" })
    }
    if (typeof isActiveBool !== "boolean") {
      return res.status(400).json({ error: "isActive is required" })
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" })
    }

    let portfolio
    try {
      const getPortfolio = await pgClientPool.query(
        "SELECT * FROM portfolios WHERE id = $1",
        [id]
      )
      if (getPortfolio.rows.length == 0) {
        return res.status(404).json({ error: "portfolio not found" })
      }
      portfolio = getPortfolio.rows[0]
    } catch (error) {
      return next(error)
    }

    let updatedImageUrl = portfolio.icon_name // This will now store the Cloudinary URL
    const existingImageUrl = portfolio.icon_name

    // Always upload new image to Cloudinary when file is provided
    try {
      // Delete existing image from Cloudinary if it exists
      if (existingImageUrl) {
        const publicId = extractPublicId(existingImageUrl)
        if (publicId) {
          try {
            await deleteImage(publicId)
            console.log(`Deleted existing portfolio image: ${publicId}`)
          } catch (error) {
            console.log(
              `Failed to delete existing portfolio image: ${publicId}`,
              error
            )
            // Continue with upload even if deletion fails
          }
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImage(
        file.buffer,
        "dimsum/portfolios",
        `portfolio_${id}_${Date.now()}`
      )

      updatedImageUrl = uploadResult.secure_url
      console.log(`Uploaded new portfolio image: ${uploadResult.public_id}`)
    } catch (error) {
      console.log("Error handling portfolio image upload:", error)
      return res.status(500).json({ error: "Error processing portfolio image" })
    }

    try {
      await pgClientPool.query(
        "UPDATE portfolios SET name = $1, value = $2, is_active = $3, icon_name = $4 WHERE id = $5",
        [name, value, isActive, updatedImageUrl, id],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402
              return next(new Error(`${name} is already exists`))
            } else {
              return next(error)
            }
          }

          portfolio = result.rows[0]
          res.status(201)
          return res.json({ message: `portfolio with ID: ${id} is updated` })
        }
      )
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
