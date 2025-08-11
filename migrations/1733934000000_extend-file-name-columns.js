/* eslint-disable camelcase */

exports.shorthands = undefined

exports.up = (pgm) => {
  // Extend file_name columns to accommodate Cloudinary URLs (up to 500 characters)
  pgm.alterColumn("products", "file_name", {
    type: "varchar(500)",
    notNull: true,
  })

  pgm.alterColumn("articles", "file_name", {
    type: "varchar(500)",
    notNull: true,
  })

  pgm.alterColumn("announcements", "file_name", {
    type: "varchar(500)",
  })

  // Extend portfolios icon_name column
  pgm.alterColumn("portfolios", "icon_name", {
    type: "varchar(500)",
    notNull: true,
  })

  // Extend partners photo_filename column (from 200 to 500)
  pgm.alterColumn("partners", "photo_filename", {
    type: "varchar(500)",
    notNull: false,
  })
}

exports.down = (pgm) => {
  // Revert back to original column sizes
  pgm.alterColumn("products", "file_name", {
    type: "varchar(100)",
    notNull: true,
  })

  pgm.alterColumn("articles", "file_name", {
    type: "varchar(100)",
    notNull: true,
  })

  pgm.alterColumn("announcements", "file_name", {
    type: "varchar(100)",
  })

  pgm.alterColumn("portfolios", "icon_name", {
    type: "varchar(100)",
    notNull: true,
  })

  pgm.alterColumn("partners", "photo_filename", {
    type: "varchar(200)",
    notNull: false,
  })
}
