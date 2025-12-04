const express = require("express");
const router = express.Router();
const wrapAsync = require("../Utils/wrapAsync");
const listingController = require("../controllers/listings");
const { isLoggedIn, isOwner, validateListing } = require("../middleware");

const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

// ---------------- MY LISTINGS ----------------
router.get("/my", isLoggedIn, wrapAsync(async (req, res) => {
    // Fetch listings belonging to the current user
    const myListings = await listingController.getListingsByOwner(req.user._id);
    res.render("listings/myListings", { listings: myListings, currentUser: req.user });
}));

// ---------------- CREATE + INDEX ----------------
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        validateListing,
        upload.single("image"),
        wrapAsync(listingController.createListing)
    );

// ---------------- NEW FORM ----------------
router.get("/new", isLoggedIn, listingController.renderNewForm);

// ---------------- SHOW + UPDATE + DELETE ----------------
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        validateListing,
        upload.single("image"),
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListing)
    );

// ---------------- EDIT FORM ----------------
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;
