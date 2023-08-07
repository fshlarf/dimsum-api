const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const {
      categoryId,
      name,
      quantity,
      unit,
      packaging,
      resellerPrice,
      agentPrice,
    } = req.body;
    const file = req.file;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!categoryId) {
      return res.status(400).json({ error: "categoryId is required" });
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

    // upload product image
    let fileName = null;
    fileName = `${Date.now()}-${file.originalname}`;
    const destinationPath = path.join(
      process.cwd(),
      `public/images/products/`,
      fileName
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

    // create product
    try {
      let product;
      await pgClientPool.query(
        "INSERT INTO products (category_id, name, quantity, unit, packaging, reseller_price, agent_price, file_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [
          categoryId,
          name,
          quantity,
          unit,
          packaging,
          resellerPrice,
          agentPrice,
          fileName,
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
          return res.json({
            message: `product with ID: ${product.id} is created`,
          });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
