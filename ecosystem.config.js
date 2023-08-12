module.exports = {
  apps: [
    {
      name: "dimsum-api",
      exec_mode: "cluster",
      instances: "2", // Or a number of instances
      script: "server.js",
      args: "",
    },
  ],
};
