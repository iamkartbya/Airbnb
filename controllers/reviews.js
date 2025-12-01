const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    let rating = Number(req.body.review.rating);
    if (!rating || rating < 1) rating = 1;
    req.body.review.rating = rating;

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    await newReview.save();

    listing.reviews.push(newReview._id);
    await listing.save();

    req.flash("success", "New Review Created!");
    return res.redirect(`/listings/${id}`);
  } catch (err) {
    return next(err);
  }
};

module.exports.destroyReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;

    const listing = await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review Deleted!");
    return res.redirect(`/listings/${id}`);
  } catch (err) {
    return next(err);
  }
};
