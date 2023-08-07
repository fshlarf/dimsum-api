/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("session", {
    sid: { type: "varchar", notNull: true },
    sess: { type: "json", notNull: true },
    expire: { type: "timestamp(6)", notNull: true },
  });
  pgm.addConstraint(
    "session",
    "session_pkey",
    "PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE"
  );
  pgm.createIndex("session", "expire", { name: "IDX_session_expire" });

  pgm.createTable("users", {
    id: "id",
    name: { type: "varchar(100)", notNull: true },
    phone: { type: "varchar(100)", notNull: true },
    email: { type: "varchar(100)", notNull: true },
    password: { type: "varchar(100)", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    sid: { type: "varchar(100)" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("users", "email");
  pgm.addConstraint("users", "users_email_unique", { unique: "email" });

  pgm.createTable("categories", {
    id: "id",
    name: { type: "varchar(100)", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("categories", "name");
  pgm.addConstraint("categories", "categories_name_unique", { unique: "name" });

  pgm.createTable("products", {
    id: "id",
    category_id: {
      type: "integer",
      notNull: true,
      references: '"categories"',
      onDelete: "cascade",
    },
    name: { type: "varchar(100)", notNull: true },
    quantity: { type: "integer", notNull: true },
    unit: { type: "varchar(100)", notNull: true },
    packaging: { type: "varchar(100)", notNull: true },
    reseller_price: { type: "integer", notNull: true },
    agent_price: { type: "integer", notNull: true },
    file_name: { type: "varchar(100)", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("products", "name");
  pgm.addConstraint("products", "products_name_unique", { unique: "name" });

  pgm.createTable("portfolios", {
    id: "id",
    icon_name: { type: "varchar(100)", notNull: true },
    name: { type: "varchar(100)", notNull: true },
    value: { type: "varchar(100)", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("portfolios", "name");
  pgm.addConstraint("portfolios", "portfolios_name_unique", { unique: "name" });

  pgm.createTable("announcements", {
    id: "id",
    name: { type: "varchar(100)", notNull: true },
    file_name: { type: "varchar(100)", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("rewards", {
    id: "id",
    name: { type: "varchar(100)", notNull: true },
    description: { type: "text", notNull: true },
    sequence: { type: "integer", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("rewards", "name");
  pgm.addConstraint("rewards", "rewards_name_unique", { unique: "name" });
  pgm.addConstraint("rewards", "rewards_sequence_unique", {
    unique: "sequence",
  });

  pgm.createTable("articles", {
    id: "id",
    title: { type: "varchar(200)", notNull: true },
    content: { type: "text", notNull: true },
    file_name: { type: "varchar(100)" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("articles", "title");
  pgm.addConstraint("articles", "articles_title_unique", { unique: "title" });
};

exports.down = (pgm) => {
  pgm.dropTable("articles");
  pgm.dropTable("rewards");
  pgm.dropTable("announcements");
  pgm.dropTable("portfolios");
  pgm.dropTable("products");
  pgm.dropTable("categories");
  pgm.dropTable("users");
  pgm.dropIndex("session", "IDX_session_expire");
  pgm.dropConstraint("session", "session_pkey");
  pgm.dropTable("session");
};
