const AddProductNonDimsum = require("./add-product-non-dimsum.js");
const AddProductDimsum = require("./add-product-dimsum.js");
const DeleteProduct = require("./delete-product.js");
const EditProductNonDimsum = require("./edit-product-non-dimsum.js");
const EditProductDimsum = require("./edit-product-dimsum.js");
const GetProducts = require("./get-products.js");
const GetProductById = require("./get-product-by-id.js");
const GetProductsC = require("./get-products-c.js");
const GetFavoritedProductsC = require("./get-product-favorited-c.js");
const GetProductByIdC = require("./get-product-by-id-c.js");
const AddProductToFavorited = require("./add-to-favorited.js");
const RemoveProductFromFavorited = require("./remove-from-favorited.js");

module.exports = {
  AddProductNonDimsum,
  AddProductDimsum,
  DeleteProduct,
  EditProductNonDimsum,
  EditProductDimsum,
  GetProducts,
  GetProductById,
  GetProductsC,
  GetFavoritedProductsC,
  GetProductByIdC,
  AddProductToFavorited,
  RemoveProductFromFavorited,
};
