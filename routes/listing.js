const express = require("express");
const router = express.Router();
const wrapAsync = require("../Utils/wrapAsync.js");
const listingController = require("../controllers/listings.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// ---------------- INDEX + CREATE ----------------
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        validateListing,          // Validate input first
        upload.single("image"),   // Then handle file upload
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
        validateListing,          // Validate input first
        upload.single("image"),   // Then handle file upload
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
