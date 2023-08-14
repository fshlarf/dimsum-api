const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const pg = require("pg");
// const promClient = require("prom-client");
const expressSession = require("express-session");
const express = require("express");
const connectPgSimple = require("connect-pg-simple");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
// const morgan = require("morgan");

// pages
// const homePageController = require("../controllers/pages/home/index.js");
// const loginPageController = require("../controllers/pages/login/index.js");
// const registerPageController = require("../controllers/pages/register/index.js");

// apis
const UserApi = require("./controllers/apis/users/index.js");
const AnnouncementApi = require("./controllers/apis/announcements/index.js");
const ArticleApi = require("./controllers/apis/articles/index.js");
const CategoryApi = require("./controllers/apis/categories/index.js");
const PortfolioApi = require("./controllers/apis/portfolios/index.js");
const ProductApi = require("./controllers/apis/products/index.js");
const RewardApi = require("./controllers/apis/rewards/index.js");

dotenv.config();
const { Pool: PgPool } = pg;

const app = express();
app.disable("x-powered-by");
const port = process.env.PORT || 16000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const {
  SESSION_SECRET: sessionSecret,
  POSTGRES_HOST: postgresHost,
  POSTGRES_PORT: postgresPort,
  POSTGRES_USERNAME: postgresUsername,
  POSTGRES_PASSWORD: postgresPassword,
  POSTGRES_DATABASE_NAME: postgresDatabaseName,
} = process.env;

const whitelist = [
  "https://produsendimsum.com",
  "https://www.produsendimsum.com",
  "https://admin.produsendimsum.com",
  "https://www.admin.produsendimsum.com",
  "http://localhost:13000",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("trust proxy", 1);

const pgConfig = {
  host: postgresHost,
  port: postgresPort,
  user: postgresUsername,
  password: postgresPassword,
  database: postgresDatabaseName,
};
const pgClientPool = new PgPool(pgConfig);

Promise.all([
  pgClientPool
    .connect()
    .then(() => console.log("connected to postgres"))
    .catch(console.error),
]).then(() => {
  const deps = {
    pgClientPool,
  };

  app.use(
    expressSession({
      store: new (connectPgSimple(expressSession))({
        conObject: pgConfig,
      }),
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        // secure: process.env.NODE_ENV === "development" ? false : true,
        // httpOnly: process.env.NODE_ENV === "development" ? false : true,
        // sameSite: process.env.NODE_ENV === "development" ? false : "none",
      },
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      sameSite: "none",
    })
  );
  app.set("view engine", "ejs");
  app.get("/healthz", (req, res) => {
    res.json({ message: "ok" });
  });
  // Apply the middleware to the route that serves static files
  app.use("/api/bucket", express.static(path.join(process.cwd(), "public")));

  // pages
  // app.get("/", homePageController(deps));
  // app.get("/login", loginPageController(deps));

  // userApi
  // app.get("/api/users/me", UserApi.Me(deps));
  app.post("/api/users/authenticate", UserApi.Authenticate(deps));
  app.post("/api/users/logout", UserApi.Logout(deps));
  app.post("/api/users", UserApi.AddUser(deps));
  app.get("/api/users", UserApi.GetUsers(deps));
  app.patch("/api/users/:id", UserApi.EditUser(deps));
  app.delete("/api/users/:id", UserApi.DeleteUser(deps));
  app.get("/api/users/me", UserApi.Me(deps));

  // announcementApi
  app.post(
    "/api/announcements",
    upload.single("file"),
    AnnouncementApi.AddAnnouncement(deps)
  );
  app.delete(
    "/api/announcements/:id",
    AnnouncementApi.DeleteAnnouncement(deps)
  );
  app.patch(
    "/api/announcements/:id",
    upload.single("file"),
    AnnouncementApi.EditAnnouncement(deps)
  );
  app.get("/api/announcements", AnnouncementApi.GetAnnouncement(deps));
  app.get(
    "/api/customer/announcements",
    AnnouncementApi.GetAnnouncementC(deps)
  );

  // articleApi
  app.post("/api/articles", upload.single("file"), ArticleApi.AddArticle(deps));
  app.delete("/api/articles/:id", ArticleApi.DeleteArticle(deps));
  app.patch(
    "/api/articles/:id",
    upload.single("file"),
    ArticleApi.EditArticle(deps)
  );
  app.get("/api/articles", ArticleApi.GetArticles(deps));
  app.get("/api/articles/:id", ArticleApi.GetArticleById(deps));
  app.get("/api/customer/articles", ArticleApi.GetArticlesC(deps));
  app.get("/api/customer/articles/:id", ArticleApi.GetArticleByIdC(deps));

  // categoryApi
  app.post("/api/categories", CategoryApi.AddCategory(deps));
  app.delete("/api/categories/:id", CategoryApi.DeleteCategory(deps));
  app.patch("/api/categories/:id", CategoryApi.EditCategory(deps));
  app.get("/api/categories", CategoryApi.GetCategories(deps));
  app.get("/api/customer/categories", CategoryApi.GetCategoriesC(deps));
  app.get("/api/categories/:id", CategoryApi.GetCategoryById(deps));

  // portfolioApi
  app.post(
    "/api/portfolios",
    upload.single("file"),
    PortfolioApi.AddPortfolio(deps)
  );
  app.delete("/api/portfolios/:id", PortfolioApi.DeletePortfolio(deps));
  app.patch(
    "/api/portfolios/:id",
    upload.single("file"),
    PortfolioApi.EditPortfolio(deps)
  );
  app.get("/api/portfolios", PortfolioApi.GetPortfolios(deps));
  app.get("/api/customer/portfolios", PortfolioApi.GetPortfoliosC(deps));
  app.get("/api/portfolios/:id", PortfolioApi.GetPortfolioById(deps));

  // productApi
  app.post("/api/products", upload.single("file"), ProductApi.AddProduct(deps));
  app.delete("/api/products/:id", ProductApi.DeleteProduct(deps));
  app.patch(
    "/api/products/:id",
    upload.single("file"),
    ProductApi.EditProduct(deps)
  );
  app.get("/api/products", ProductApi.GetProducts(deps));
  app.get("/api/products/:id", ProductApi.GetProductById(deps));
  app.get("/api/customer/products", ProductApi.GetProductsC(deps));
  app.get("/api/customer/products/:id", ProductApi.GetProductByIdC(deps));

  // rewardApi
  app.post("/api/rewards", RewardApi.AddReward(deps));
  app.delete("/api/rewards/:id", RewardApi.DeleteReward(deps));
  app.patch("/api/rewards/:id", RewardApi.EditReward(deps));
  app.get("/api/rewards", RewardApi.GetRewards(deps));
  app.get("/api/customer/rewards", RewardApi.GetRewardsC(deps));
  app.get("/api/rewards/:id", RewardApi.GetRewardById(deps));

  app.use((err, req, res, next) => {
    res.status(res.locals.statusCode || 500);
    if (req.path.startsWith("/api/")) {
      res.json({ error: err.message || err });
    } else {
      res.render(`pages/error-${res.locals.statusCode || 500}`);
    }
  });

  const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
      pgClientPool.end();
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
      pgClientPool.end();
      process.exit(0);
    });
  });
});
