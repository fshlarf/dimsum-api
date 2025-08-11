const { uploadImage } = require("../../../helpers/cloudinary")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { rewardId, name, phone, email, address, joinDate, testimony } =
      req.body
    const file = req.file
    const { user } = req.session

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

    // upload partner profile image to Cloudinary
    let imageUrl = null
    try {
      const uploadResult = await uploadImage(
        file.buffer,
        "dimsum/partners",
        `partner_${Date.now()}`
      )
      fileName, console.log(`Uploaded partner image: ${uploadResult.public_id}`)
    } catch (error) {
      console.log("Error uploading partner image:", error)
      return res.status(500).json({ error: "Error uploading partner image" })
    }

    try {
      let partner
      // create partner
      await pgClientPool.query(
        "INSERT INTO partners (reward_id, name, phone_number, email, address, join_date, testimony, photo_filename) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [
          rewardId,
          name,
          phone,
          email,
          address,
          joinDate ? joinDate : null,
          testimony,
          imageUrl,
        ],
        (error, result) => {
          if (error) {
            console.log(error)
            return next(error)
          }
          partner = result.rows[0]
          res.status(201)
          return res.json({
            message: `partner with ID: ${partner.id} is created`,
          })
        }
      )
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
