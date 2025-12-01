if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user");
const listingsRouter = require("./routes/listing");
const reviewsRouter = require("./routes/review");
const userRouter = require("./routes/user");
const ExpressError = require("./Utils/ExpressError.js");

// ------------------ MONGODB ATLAS ------------------
const dbUrl = process.env.ATLASDB_URL ;
//console.log("MongoDB URL:", process.env.ATLASDB_URL);

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

// ------------------ VIEW ENGINE ------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ------------------ MIDDLEWARE ------------------
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ------------------ SESSION ------------------
let store;
try {
  store = MongoStore({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 3600, // time period in seconds
  });

  // store error handling
  store.on("error", (e) => {
    console.log("MongoStore Error:", e);
  });
} catch (e) {
  console.log("Session store creation failed:", e);
}

const sessionOptions = {
  store,
  secret:process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// ------------------ PASSPORT ------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ------------------ GLOBAL LOCALS ------------------
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ------------------ ROUTES ------------------
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// ------------------ HOME ROUTE ------------------
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// ------------------ 404 HANDLER ------------------
app.use((req, res, next) => {
 const err=new ExpressError(404, "Page Not Found");
 next(err);
});

// ------------------ ERROR HANDLER ------------------
app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong!" } = err;
  if (!res.headersSent) {
    res.status(status).render("error.ejs", { err });
  } else {
    console.error("Headers already sent:", err);
  }
});

// ------------------ SERVER ------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
