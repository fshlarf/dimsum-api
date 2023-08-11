const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;
    const { name, quantity, unit, packaging, resellerPrice, agentPrice } =
      req.body;
    const file = req.file;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!quantity) {
      return res.status(400).json({ error: "quantity is required" });
    }
    if (!unit) {
      return res.status(400).json({ error: "unit is required" });
    }
    if (!packaging) {
      return res.status(400).json({ error: "packaging is required" });
    }
    if (!resellerPrice) {
      return res.status(400).json({ error: "resellerPrice is required" });
    }
    if (!agentPrice) {
      return res.status(400).json({ error: "agentPrice is required" });
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
        return res.status(500).json({ error: "Error deleting product image" });
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
      await pgClientPool.query(
        "UPDATE products SET name = $1, quantity = $2, unit = $3, packaging = $4, reseller_price = $5, agent_price = $6, file_name = $7 WHERE id = $8",
        [
          name,
          quantity,
          unit,
          packaging,
          resellerPrice,
          agentPrice,
          updatedFileName,
          id,
        ],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402;
              return next(new Error(`${name} is already exists`));
            } else {
              return next(error);
            }
          }

          product = result.rows[0];
          res.status(201);
          return res.json({ message: `product with ID: ${id} is updated` });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
