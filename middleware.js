const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./Utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

// ---------------- LOGIN CHECK ----------------
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in first!");
    return res.redirect("/login"); // ✅ return prevents double headers
  }
  return next();
};

// ---------------- SAVE REDIRECT URL ----------------
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  return next();
};

// ---------------- OWNER CHECK ----------------
module.exports.isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    if (!res.locals.currentUser) {
      req.flash("error", "You must be logged in!");
      return res.redirect("/login");
    }

    if (!listing.owner.equals(res.locals.currentUser._id)) {
      req.flash("error", "You are not authorized to do this!");
      return res.redirect(`/listings/${id}`);
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// ---------------- REVIEW AUTHOR CHECK ----------------
module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      req.flash("error", "Review not found!");
      return res.redirect(`/listings/${id}`);
    }

    if (!res.locals.currentUser) {
      req.flash("error", "You must be logged in!");
      return res.redirect("/login");
    }

    if (!review.author.equals(res.locals.currentUser._id)) {
      req.flash("error", "You are not authorized to do this!");
      return res.redirect(`/listings/${id}`);
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// ---------------- JOI LISTING VALIDATION ----------------
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  return next();
};

// ---------------- JOI REVIEW VALIDATION ----------------
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  return next();
};
