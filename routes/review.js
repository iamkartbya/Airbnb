const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams needed to get listing ID
const wrapAsync = require("../Utils/wrapAsync.js");
const reviewController = require("../controllers/reviews.js");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware.js");

// ---------------- CREATE REVIEW ----------------
router.post(
    "/",
    isLoggedIn,
    validateReview,
    wrapAsync(reviewController.createReview)
);

// ---------------- DELETE REVIEW ----------------
router.delete(
    "/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.destroyReview)
);

module.exports = router;
