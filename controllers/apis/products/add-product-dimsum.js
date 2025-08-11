const { uploadImage } = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const {
      categoryId,
      name,
      isFavorited,
      boxQuantity,
      boxUnit,
      boxResellerPrice,
      boxAgentPrice,
      boxDescription,
      mikaQuantity,
      mikaUnit,
      mikaResellerPrice,
      mikaAgentPrice,
      mikaDescription,
    } = req.body
    const file = req.file
    const isFavoritedBoolean = JSON.parse(isFavorited)

    if (!user) {
      return res.status(401).json({ error: "unauthorized" })
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" })
    }
    if (!categoryId) {
      return res.status(400).json({ error: "categoryId is required" })
    }
    if (typeof isFavoritedBoolean !== "boolean") {
      return res.status(400).json({ error: "isFavorited is required" })
    }
    if (!boxQuantity) {
      return res.status(400).json({ error: "boxQuantity is required" })
    }
    if (!boxUnit) {
      return res.status(400).json({ error: "boxUnit is required" })
    }
    if (!boxResellerPrice) {
      return res.status(400).json({ error: "boxResellerPrice is required" })
    }
    if (!boxAgentPrice) {
      return res.status(400).json({ error: "boxAgentPrice is required" })
    }
    if (!boxDescription) {
      return res.status(400).json({ error: "boxDescription is required" })
    }
    if (!mikaQuantity) {
      return res.status(400).json({ error: "mikaQuantity is required" })
    }
    if (!mikaUnit) {
      return res.status(400).json({ error: "mikaUnit is required" })
    }
    if (!mikaResellerPrice) {
      return res.status(400).json({ error: "mikaResellerPrice is required" })
    }
    if (!mikaAgentPrice) {
      return res.status(400).json({ error: "mikaAgentPrice is required" })
    }
    if (!mikaDescription) {
      return res.status(400).json({ error: "mikaDescription is required" })
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
        [categoryId, name, isFavoritedBoolean, imageUrl]
      )
      product = result.rows[0]

      await pgClientPool.query(
        "INSERT INTO product_variants (product_id, description, quantity, unit, packaging, reseller_price, agent_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          product.id,
          boxDescription,
          boxQuantity,
          boxUnit,
          "box",
          boxResellerPrice,
          boxAgentPrice,
        ]
      )

      await pgClientPool.query(
        "INSERT INTO product_variants (product_id, description, quantity, unit, packaging, reseller_price, agent_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          product.id,
          mikaDescription,
          mikaQuantity,
          mikaUnit,
          "mika",
          mikaResellerPrice,
          mikaAgentPrice,
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
