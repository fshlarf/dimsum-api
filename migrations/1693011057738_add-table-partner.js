/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("portfolios", {
    sequence: {
      type: "integer",
      notNull: true,
      default: 1,
    },
  });

  pgm.addColumns("products", {
    is_favorited: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });
  pgm.dropColumns("products", [
    "quantity",
    "unit",
    "packaging",
    "reseller_price",
    "agent_price",
  ]);

  pgm.addColumns("announcements", {
    link: {
      type: "varchar(200)",
      notNull: false,
    },
  });

  pgm.createTable("product_variants", {
    id: "id",
    product_id: {
      type: "integer",
      notNull: true,
      references: '"products"',
      onDelete: "cascade",
    },
    description: { type: "text", notNull: true },
    quantity: { type: "integer", notNull: true },
    unit: { type: "varchar(100)", notNull: true },
    packaging: { type: "varchar(100)", notNull: true },
    reseller_price: { type: "integer", notNull: true },
    agent_price: { type: "integer", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("product_variants", "packaging");

  pgm.createTable("partners", {
    id: "id",
    reward_id: {
      type: "integer",
      notNull: false,
      references: '"rewards"',
      onDelete: "cascade",
    },
    name: {
      type: "varchar(100)",
      notNull: true,
    },
    email: {
      type: "varchar(100)",
      notNull: false,
    },
    phone_number: {
      type: "varchar(100)",
      notNull: false,
    },
    address: {
      type: "text",
      notNull: false,
    },
    photo_filename: {
      type: "varchar(200)",
      notNull: false,
    },
    join_date: {
      type: "timestamp",
      notNull: false,
    },
    testimony: {
      type: "text",
      notNull: false,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("partners", "name");
};

exports.down = (pgm) => {
  pgm.dropTable("partners");
  pgm.dropTable("product_variants");
  pgm.dropColumns("announcements", ["link"]);
  pgm.addColumns("products", {
    quantity: { type: "integer", notNull: true },
    unit: { type: "varchar(100)", notNull: true },
    packaging: { type: "varchar(100)", notNull: true },
    reseller_price: { type: "integer", notNull: true },
    agent_price: { type: "integer", notNull: true },
  });
  pgm.dropColumns("products", ["is_favorited"]);
  pgm.dropColumns("portfolios", ["sequence"]);
};
