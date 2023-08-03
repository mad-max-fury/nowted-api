const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const express = require("express");
const AppError = require("./errors/appError");
const appErrorHandler = require("./errors/app_error_handler");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const passportSetup = require("./config/passport");
// Initalize app
const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
//GLOBAL MIDDLEWARES
//Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//data sanitization NoSql
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());
//security headers
app.use(helmet());
//prevent parameter pollution
app.use(
  hpp({
    whitelist: [],
  })
);
// enable cors for specific route
const allowedOrigins = ["https://nowted-one.vercel.app/"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// enable morgan
app.use(morgan("dev"));
//api limiting
const limiter = rateLimit({
  max: 200,
  windowsMs: 60 * 60 * 1000,
  message: "Too many requests from this Ip, please try again in an hour!",
});

app.use(
  session({
    secret: process.env.GOOGLE_CLIENT_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/", limiter);

//ROUTES
app.use("/api/v1/users", require("./routes/userRoute"));

app.get("/", (req, res) => {
  res
    .status(200)
    .redirect("https://documenter.getpostman.com/view/28561006/2s946ffYp6");
});
app.get("/health", (req, res) => {
  res.status(200).send("API IS HEALTHY!");
});

app.all("**", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(appErrorHandler);

module.exports = app;
