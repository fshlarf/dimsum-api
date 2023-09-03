const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;
    const {
      name,
      isFavorited,
      boxVariantId,
      boxQuantity,
      boxDescription,
      boxUnit,
      boxResellerPrice,
      boxAgentPrice,
      mikaVariantId,
      mikaQuantity,
      mikaDescription,
      mikaUnit,
      mikaResellerPrice,
      mikaAgentPrice,
    } = req.body;
    const file = req.file;
    const mikaPackaging = "mika";
    const boxPackaging = "box";
    const isFavoritedBoolean = JSON.parse(isFavorited);

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (typeof isFavoritedBoolean !== "boolean") {
      return res.status(400).json({ error: "isFavorited is required" });
    }
    if (!boxVariantId) {
      return res.status(400).json({ error: "boxVariantId is required" });
    }
    if (!boxQuantity) {
      return res.status(400).json({ error: "boxQuantity is required" });
    }
    if (!boxDescription) {
      return res.status(400).json({ error: "boxDescription is required" });
    }
    if (!boxUnit) {
      return res.status(400).json({ error: "boxUnit is required" });
    }
    if (!boxPackaging) {
      return res.status(400).json({ error: "boxPackaging is required" });
    }
    if (!boxResellerPrice) {
      return res.status(400).json({ error: "boxResellerPrice is required" });
    }
    if (!boxAgentPrice) {
      return res.status(400).json({ error: "boxAgentPrice is required" });
    }
    if (!mikaVariantId) {
      return res.status(400).json({ error: "mikaVariantId is required" });
    }
    if (!mikaQuantity) {
      return res.status(400).json({ error: "mikaQuantity is required" });
    }
    if (!mikaDescription) {
      return res.status(400).json({ error: "mikaDescription is required" });
    }
    if (!mikaUnit) {
      return res.status(400).json({ error: "mikaUnit is required" });
    }
    if (!mikaPackaging) {
      return res.status(400).json({ error: "mikaPackaging is required" });
    }
    if (!mikaResellerPrice) {
      return res.status(400).json({ error: "mikaResellerPrice is required" });
    }
    if (!mikaAgentPrice) {
      return res.status(400).json({ error: "mikaAgentPrice is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" });
    }

    let product;
    try {
      const getProduct = await pgClientPool.query(
        "SELECT * FROM products WHERE id = $1",
        [id]
      );
      if (getProduct.rows.length == 0) {
        return res.status(404).json({ error: "product not found" });
      }
      product = getProduct.rows[0];
    } catch (error) {
      return next(error);
    }

    let updatedFileName = product.file_name;
    const existingImageFileName = product.file_name;
    const fileName = file.originalname;

    if (existingImageFileName !== fileName) {
      // delete existing image
      const filePath = path.join(
        process.cwd(),
        `public/images/products`,
        existingImageFileName
      );
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.log("failed to delete file: " + filePath);
        if (error.code !== "ENOENT") {
          return res
            .status(500)
            .json({ error: "Error deleting product image" });
        }
      }

      // upload new image
      updatedFileName = `${Date.now()}-${file.originalname}`;
      const destinationPath = path.join(
        process.cwd(),
        `public/images/products/`,
        updatedFileName
      );
      // create the directory
      const directory = path.dirname(destinationPath);
      await fs.mkdir(directory, { recursive: true });
      // Move the file to the directory
      try {
        await fs.writeFile(destinationPath, file.buffer);
      } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "error saving product image" });
      }
    }

    try {
      await pgClientPool.query("BEGIN");
      await pgClientPool.query(
        "UPDATE products SET name = $1, is_favorited = $2, file_name = $3 WHERE id = $4",
        [name, isFavorited, updatedFileName, id]
      );

      await pgClientPool.query(
        "UPDATE product_variants SET description = $1, quantity = $2, unit = $3, packaging = $4, reseller_price = $5, agent_price = $6 WHERE id = $7",
        [
          boxDescription,
          boxQuantity,
          boxUnit,
          boxPackaging,
          boxResellerPrice,
          boxAgentPrice,
          boxVariantId,
        ]
      );

      await pgClientPool.query(
        "UPDATE product_variants SET description = $1, quantity = $2, unit = $3, packaging = $4, reseller_price = $5, agent_price = $6 WHERE id = $7",
        [
          mikaDescription,
          mikaQuantity,
          mikaUnit,
          mikaPackaging,
          mikaResellerPrice,
          mikaAgentPrice,
          mikaVariantId,
        ]
      );

      await pgClientPool.query("COMMIT");

      res.status(201);
      return res.json({ message: `product with ID: ${id} is updated` });
    } catch (e) {
      await pgClientPool.query("ROLLBACK");
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
