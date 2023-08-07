/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.db.query(`
    INSERT INTO users (name, email, password, is_active, phone)
    VALUES ('system', 'system@mail.com', '$2y$10$5vcbPwrtGblMlvS0LAy88.hFfP0vgvzlTG9x2/wL8WY1qDKG2aG2i', true, '62812345678');
  `);
};

exports.down = (pgm) => {
  pgm.db.query(`
    DELETE FROM users WHERE email = 'system@mail.com';
  `);
};
