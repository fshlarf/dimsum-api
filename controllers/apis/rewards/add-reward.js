module.exports = function ({ pgClientPool }) {
  return async function (req, res, next) {
    const { user } = req.session;
    const { name, description } = req.body;
    let sequence;

    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!description) {
      return res.status(400).json({ error: "description is required" });
    }

    try {
      const getTotal = await pgClientPool.query("SELECT COUNT(*) FROM rewards");
      const total = parseInt(getTotal.rows[0].count);
      if (total >= 6) {
        return res
          .status(403)
          .json({ error: "already reached max reward limit" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "error get total reward" });
    }

    try {
      let lastSequence;
      const getLastReward = await pgClientPool.query(
        "SELECT * FROM rewards ORDER BY sequence DESC LIMIT 1"
      );
      lastSequence =
        getLastReward.rows.length > 0 ? getLastReward.rows[0].sequence : 0;
      sequence = lastSequence + 1;
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "failed to get rewards" });
    }

    // create reward
    try {
      let reward;
      await pgClientPool.query(
        "INSERT INTO rewards (name, description, sequence, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, description, sequence, true],
        (error, result) => {
          if (error) {
            if (error.code == "23505") {
              res.locals.statusCode = 402;
              return next(new Error(`${name} is already exists`));
            } else {
              return next(error);
            }
          }
          reward = result.rows[0];
          res.status(201);
          return res.json({
            message: `reward with ID: ${reward.id} is created`,
          });
        }
      );
    } catch (e) {
      res.locals.statusCode = 500;
      next(e);
    }
  };
};
