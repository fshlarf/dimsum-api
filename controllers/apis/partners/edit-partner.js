const {
  uploadImage,
  deleteImage,
  extractPublicId,
} = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const { id } = req.params
    const { name, rewardId, email, phone, address, joinDate, testimony } =
      req.body
    const file = req.file

    if (!user) {
      return res.status(401).json({ error: "unauthorized" })
    }
    if (!rewardId) {
      return res.status(400).json({ error: "rewardId is required" })
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" })
    }
    if (!address) {
      return res.status(400).json({ error: "address is required" })
    }
    if (!testimony) {
      return res.status(400).json({ error: "testimony is required" })
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" })
    }

    let partner
    try {
      const getPartner = await pgClientPool.query(
        "SELECT * FROM partners WHERE id = $1",
        [id]
      )
      if (getPartner.rows.length == 0) {
        return res.status(404).json({ error: "partner not found" })
      }
      partner = getPartner.rows[0]
    } catch (error) {
      return next(error)
    }

    let updatedImageUrl = partner.photo_filename // This will now store the Cloudinary URL
    const existingImageUrl = partner.photo_filename
    const fileName = file.originalname

    // Always upload new image to Cloudinary when file is provided
    try {
      // Delete existing image from Cloudinary if it exists
      if (existingImageUrl) {
        const publicId = extractPublicId(existingImageUrl)
        if (publicId) {
          try {
            await deleteImage(publicId)
            console.log(`Deleted existing partner image: ${publicId}`)
          } catch (error) {
            console.log(
              `Failed to delete existing partner image: ${publicId}`,
              error
            )
            // Continue with upload even if deletion fails
          }
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImage(
        file.buffer,
        "dimsum/partners",
        `partner_${id}_${Date.now()}`
      )

      updatedImageUrl = uploadResult.secure_url
      console.log(`Uploaded new partner image: ${uploadResult.public_id}`)
    } catch (error) {
      console.log("Error handling partner image upload:", error)
      return res.status(500).json({ error: "Error processing partner image" })
    }

    try {
      await pgClientPool.query(
        "UPDATE partners SET name = $1, reward_id = $2, email = $3, phone_number = $4, address = $5, join_date = $6, testimony = $7, photo_filename = $8 WHERE id = $9",
        [
          name,
          rewardId,
          email,
          phone,
          address,
          joinDate,
          testimony,
          updatedImageUrl,
          id,
        ],
        (error, result) => {
          if (error) {
            return next(error)
          }
          partner = result.rows[0]
          res.status(201)
          return res.json({ message: `partner with ID: ${id} is updated` })
        }
      )
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
