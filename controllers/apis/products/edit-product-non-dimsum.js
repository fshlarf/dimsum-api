const {
  uploadImage,
  deleteImage,
  extractPublicId,
} = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const { id, variantId } = req.params
    const {
      name,
      isFavorited,
      quantity,
      description,
      unit,
      packaging,
      resellerPrice,
      agentPrice,
    } = req.body
    const file = req.file
    const isFavoritedBoolean = JSON.parse(isFavorited)

    if (!user) {
      return res.status(401).json({ error: "unauthorized" })
    }
    if (!id) {
      return res.status(400).json({ error: "id is required" })
    }
    if (!variantId) {
      return res.status(400).json({ error: "variantId is required" })
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" })
    }
    if (typeof isFavoritedBoolean !== "boolean") {
      return res.status(400).json({ error: "isFavorited is required" })
    }
    if (!quantity) {
      return res.status(400).json({ error: "quantity is required" })
    }
    if (!description) {
      return res.status(400).json({ error: "description is required" })
    }
    if (!unit) {
      return res.status(400).json({ error: "unit is required" })
    }
    if (!packaging) {
      return res.status(400).json({ error: "packaging is required" })
    }
    if (!resellerPrice) {
      return res.status(400).json({ error: "resellerPrice is required" })
    }
    if (!agentPrice) {
      return res.status(400).json({ error: "agentPrice is required" })
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" })
    }

    let product
    try {
      const getProduct = await pgClientPool.query(
        "SELECT * FROM products WHERE id = $1",
        [id]
      )
      if (getProduct.rows.length == 0) {
        return res.status(404).json({ error: "product not found" })
      }
      product = getProduct.rows[0]
    } catch (error) {
      return next(error)
    }

    let updatedImageUrl = product.file_name // This will now store the Cloudinary URL
    const existingImageUrl = product.file_name
    const fileName = file.originalname

    // Always upload new image to Cloudinary when file is provided
    try {
      // Delete existing image from Cloudinary if it exists
      if (existingImageUrl) {
        const publicId = extractPublicId(existingImageUrl)
        if (publicId) {
          try {
            await deleteImage(publicId)
            console.log(`Deleted existing image: ${publicId}`)
          } catch (error) {
            console.log(`Failed to delete existing image: ${publicId}`, error)
            // Continue with upload even if deletion fails
          }
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImage(
        file.buffer,
        "dimsum/products",
        `product_${id}_${Date.now()}`
      )

      updatedImageUrl = uploadResult.secure_url
      console.log(`Uploaded new image: ${uploadResult.public_id}`)
    } catch (error) {
      console.log("Error handling image upload:", error)
      return res.status(500).json({ error: "Error processing product image" })
    }

    try {
      await pgClientPool.query("BEGIN")
      await pgClientPool.query(
        "UPDATE products SET name = $1, is_favorited = $2, file_name = $3 WHERE id = $4",
        [name, isFavorited, updatedImageUrl, id]
      )

      await pgClientPool.query(
        "UPDATE product_variants SET description = $1, quantity = $2, unit = $3, packaging = $4, reseller_price = $5, agent_price = $6 WHERE id = $7",
        [
          description,
          quantity,
          unit,
          packaging,
          resellerPrice,
          agentPrice,
          variantId,
        ]
      )

      await pgClientPool.query("COMMIT")

      res.status(201)
      return res.json({ message: `product with ID: ${id} is updated` })
    } catch (e) {
      await pgClientPool.query("ROLLBACK")
      res.locals.statusCode = 500
      next(e)
    }
  }
}
