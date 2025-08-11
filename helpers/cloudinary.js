const cloudinary = require("cloudinary").v2
require("dotenv").config()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Debug: Check if environment variables are loaded
console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET",
})

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder to store the image
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadImage = (buffer, folder = "dimsum", publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: folder,
      resource_type: "image",
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto" },
      ],
    }

    if (publicId) {
      options.public_id = publicId
    }

    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
      .end(buffer)
  })
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Cloudinary deletion result
 */
const deleteImage = (publicId) => {
  return cloudinary.uploader.destroy(publicId)
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
const extractPublicId = (url) => {
  if (!url) return null

  // Extract public ID from Cloudinary URL
  // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image_name.jpg
  const parts = url.split("/")
  const uploadIndex = parts.findIndex((part) => part === "upload")

  if (uploadIndex === -1) return null

  // Get everything after 'upload/v{version}/' or 'upload/'
  let publicIdParts = parts.slice(uploadIndex + 1)

  // Remove version if present (starts with 'v' followed by numbers)
  if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
    publicIdParts = publicIdParts.slice(1)
  }

  // Join the remaining parts and remove file extension
  const publicId = publicIdParts.join("/")
  return publicId.replace(/\.[^/.]+$/, "") // Remove file extension
}

module.exports = {
  uploadImage,
  deleteImage,
  extractPublicId,
  cloudinary,
}
