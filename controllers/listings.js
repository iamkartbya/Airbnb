const Listing = require("../models/listing");
const { getCoordinates } = require("../Utils/geocoder");


// LISTINGS INDEX
module.exports.index = async (req, res, next) => {
  try {
    const allListings = await Listing.find({});
    return res.render("listings/index", { allListings });
  } catch (err) {
    return next(err);
  }
};

// NEW FORM
module.exports.renderNewForm = (req, res) => {
  return res.render("listings/new.ejs");
};

// SHOW LISTING
module.exports.showListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" }
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing you requested does not exist.");
      return res.redirect("/listings");
    }

    const ownerListings = await Listing.find({ owner: listing.owner._id });

    return res.render("listings/show", { listing, ownerListings });
  } catch (err) {
    return next(err);
  }
};

// CREATE LISTING
module.exports.createListing = async (req, res, next) => {
  try {
    if (!req.user) {
      req.flash("error", "You must be logged in to create a listing.");
      return res.redirect("/login");
    }

    const geoData = await getCoordinates(req.body.listing.location);

    if (!geoData) {
      req.flash("error", `Invalid location: "${req.body.listing.location}". Please enter a valid city or address.`);
      return res.redirect("/listings/new");
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = req.file
      ? { url: req.file.path, filename: req.file.filename }
      : { url: "/default-image.jpg", filename: "default" };

    newListing.geometry = {
      type: "Point",
      coordinates: [parseFloat(geoData.lon), parseFloat(geoData.lat)]
    };

    await newListing.save();
    req.flash("success", "New listing created successfully!");
    return res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while creating the listing.");
    return res.redirect("/listings/new");
  }
};

// RENDER EDIT FORM
module.exports.renderEditForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
  let originalImageUrl=listing.image.url;
    return res.render("listings/edit", { listing,originalImageUrl });
  } catch (err) {
    return next(err);
  }
};

// UPDATE LISTING
// controllers/listingController.js
module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    // Update location geometry if changed
    if (req.body.listing.location && req.body.listing.location !== listing.location) {
      const geoData = await getCoordinates(req.body.listing.location);
      if (geoData) {
        listing.geometry = {
          type: "Point",
          coordinates: [parseFloat(geoData.lon), parseFloat(geoData.lat)] // [lng, lat] for GeoJSON
        };
        listing.location = req.body.listing.location;
      } else {
        req.flash("error", `Invalid location: "${req.body.listing.location}". Location not updated.`);
      }
    }

    // Update image if uploaded
    if (req.file) {
      listing.image = { url: req.file.path, filename: req.file.filename };
    }

    await listing.save();

    // Emit live update via Socket.IO
    const io = req.app.get("io");
    io.emit("listingLocationUpdated", {
      id: listing._id.toString(), // convert ObjectId to string
      title: listing.title,
      location: listing.location,
      coordinates: listing.geometry.coordinates // [lng, lat]
    });

    console.log("📡 Emitting live update:", {
      id: listing._id.toString(),
      coordinates: listing.geometry.coordinates
    });

    req.flash("success", "Listing updated successfully!");
    return res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while updating the listing.");
    return res.redirect(`/listings/${req.params.id}/edit`);
  }
};

// DELETE LISTING
module.exports.destroyListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndDelete(id);

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    req.flash("success", "Listing Deleted");
    return res.redirect("/listings");
  } catch (err) {
    return next(err);
  }
};
