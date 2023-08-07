/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropConstraint("rewards", "rewards_sequence_unique", {
    type: "unique",
  });
};

exports.down = (pgm) => {
  pgm.addConstraint("rewards", "rewards_sequence_unique", {
    unique: "sequence",
  });
};
