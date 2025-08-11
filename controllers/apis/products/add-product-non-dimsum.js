const { uploadImage } = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const {
      categoryId,
      name,
      description,
      quantity,
      unit,
      packaging,
      resellerPrice,
      agentPrice,
    } = req.body
    const file = req.file
    const isFavorite = false

    if (!user) {
      return res.status(401).json({ error: "unauthorized" })
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" })
    }
    if (!categoryId) {
      return res.status(400).json({ error: "categoryId is required" })
    }
    if (!description) {
      return res.status(400).json({ error: "description is required" })
    }
    if (!quantity) {
      return res.status(400).json({ error: "quantity is required" })
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

    // upload product image to Cloudinary
    let imageUrl = null
    try {
      const uploadResult = await uploadImage(
        file.buffer,
        "dimsum/products",
        `product_${Date.now()}`
      )
      imageUrl = uploadResult.secure_url
      console.log(`Uploaded product image: ${uploadResult.public_id}`)
    } catch (error) {
      console.log("Error uploading product image:", error)
      return res.status(500).json({ error: "Error uploading product image" })
    }

    // create product
    try {
      await pgClientPool.query("BEGIN")
      let product
      const result = await pgClientPool.query(
        "INSERT INTO products (category_id, name, is_favorited, file_name) VALUES ($1, $2, $3, $4) RETURNING *",
        [categoryId, name, isFavorite, imageUrl]
      )
      product = result.rows[0]

      await pgClientPool.query(
        "INSERT INTO product_variants (product_id, description, quantity, unit, packaging, reseller_price, agent_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          product.id,
          description,
          quantity,
          unit,
          packaging,
          resellerPrice,
          agentPrice,
        ]
      )

      await pgClientPool.query("COMMIT")

      res.status(201)
      return res.json({
        message: `product with ID: ${product.id} is created`,
      })
    } catch (e) {
      await pgClientPool.query("ROLLBACK")
      res.locals.statusCode = 500
      next(e)
    }
  }
}
