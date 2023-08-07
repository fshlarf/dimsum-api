const path = require("path");
const fs = require("fs/promises");

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    // delete image file
    let fileName;
    try {
      const getProduct = await pgClientPool.query(
        "SELECT * FROM products WHERE id = $1",
        [id]
      );
      if (getProduct.rows.length === 0) {
        return res.status(404).json({ error: "product not found" });
      }
      fileName = getProduct.rows[0].file_name;
    } catch (error) {
      return next(error);
    }
    if (fileName) {
      const filePath = path.join(
        process.cwd(),
        `public/images/products`,
        fileName
      );
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.log("failed to delete file: " + error);
        return res
          .status(500)
          .json({ error: `Error deleting product image: ${error}` });
      }
    }

    // delete product
    try {
      await pgClientPool.query(
        "DELETE FROM products WHERE id = $1",
        [id],
        (error) => {
          if (error) {
            return next(error);
          }
          res.status(201);
          return res.json({ message: `product with ID: ${id} is deleted` });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
