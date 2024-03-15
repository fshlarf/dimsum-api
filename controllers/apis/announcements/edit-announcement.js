const path = require("path")
const fs = require("fs/promises")

module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session
    const { id } = req.params
    const { name, link, isActive } = req.body
    const file = req.file
    let active = isActive
    if (typeof isActive !== "boolean") {
      active = true
    }

    if (!user) {
      return res.status(401).json({ error: "unauthorized" })
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" })
    }
    if (!link) {
      return res.status(400).json({ error: "link is required" })
    }
    if (!file) {
      return res.status(400).json({ error: "file is required" })
    }

    let announcement
    try {
      const getAnnouncement = await pgClientPool.query(
        "SELECT * FROM announcements WHERE id = $1",
        [id]
      )
      if (getAnnouncement.rows.length == 0) {
        return res.status(404).json({ error: "announcement not found" })
      }
      announcement = getAnnouncement.rows[0]
    } catch (error) {
      return next(error)
    }

    let updatedFileName = announcement.file_name
    const existingImageFileName = announcement.file_name
    const fileName = file.originalname

    if (existingImageFileName !== fileName) {
      // delete existing image
      const filePath = path.join(
        process.cwd(),
        `public/images/announcement`,
        existingImageFileName
      )
      try {
        await fs.unlink(filePath)
      } catch (error) {
        console.log("failed to delete file: " + error)
        return res
          .status(500)
          .json({ error: `Error deleting announcement image: ${error}` })
      }

      // upload new image
      updatedFileName = `${Date.now()}-${file.originalname}`
      const destinationPath = path.join(
        process.cwd(),
        `public/images/announcement/`,
        updatedFileName
      )
      // create the directory
      const directory = path.dirname(destinationPath)
      await fs.mkdir(directory, { recursive: true })
      // Move the file to the directory
      try {
        await fs.writeFile(destinationPath, file.buffer)
      } catch (error) {
        console.log(error)
        return res
          .status(500)
          .json({ error: "error saving announcement image" })
      }
    }

    try {
      await pgClientPool.query(
        "UPDATE announcements SET name = $1, link = $2, file_name = $3, is_active = $4 WHERE id = $5",
        [name, link, updatedFileName, active, id],
        (error, result) => {
          if (error) {
            return next(error)
          }
          announcement = result.rows[0]
        }
      )

      res.status(201)
      return res.json({ message: `announcement with ID: ${id} is updated` })
    } catch (e) {
      res.locals.statusCode = 500
      next(e)
    }
  }
}
