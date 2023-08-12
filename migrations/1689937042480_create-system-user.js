/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.db.query(`
    INSERT INTO users (name, email, password, is_active, phone)
    VALUES ('system', 'system@mail.com', '$2b$10$vRcYPWhB5WFYMSjZnSVawufImnc11dMijoXTFg9knVCTv9LkmLFR6', true, '62812345678');
  `);
};

exports.down = (pgm) => {
  pgm.db.query(`
    DELETE FROM users WHERE email = 'system@mail.com';
  `);
};
