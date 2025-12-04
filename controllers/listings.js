const Listing = require("../models/listing");
const Review = require("../models/review");
const { getCoordinates } = require("../Utils/geocoder");

// ---------------- HELPER ----------------
module.exports.getListingsByOwner = async (ownerId) => {
    return await Listing.find({ owner: ownerId }).populate("owner");
};

// ---------------- INDEX ----------------
module.exports.index = async (req, res) => {
    const { category } = req.query;
    const filter = (category && category !== "All") ? { category } : {};
    const listings = await Listing.find(filter).populate("owner");
    res.render("listings/index", { listings, selectedCategory: category || "All", currentUser: req.user });
};

// ---------------- NEW FORM ----------------
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};

// ---------------- SHOW ----------------
// ---------------- SHOW ----------------
module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // Fetch other listings by the same owner (exclude current listing)
   let ownerListings = [];
    if(listing.owner){
        ownerListings = await Listing.find({ owner: listing.owner._id }).populate("owner");
    }

    // Safe check for owner
    const isOwner = req.user && listing.owner && req.user._id.toString() === listing.owner._id.toString();

    res.render("listings/show", { listing, currentUser: req.user, isOwner, ownerListings });
};

// ---------------- CREATE ----------------
module.exports.createListing = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    const geoData = await getCoordinates(req.body.listing.location);
    if (!geoData) {
        req.flash("error", "Invalid location");
        return res.redirect("/listings/new");
    }

    const listing = req.body.listing; // <-- important!

    // Convert checkboxes to boolean
    listing.petsAllowed = listing.petsAllowed === 'on';
    listing.smokingAllowed = listing.smokingAllowed === 'on';

    const newListing = new Listing(listing);
    newListing.owner = req.user._id;
    newListing.category = listing.category;

    if (req.file) {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }

    newListing.geometry = {
        type: "Point",
        coordinates: [parseFloat(geoData.lon), parseFloat(geoData.lat)]
    };

    await newListing.save();
    req.flash("success", "Listing created!");
    res.redirect(`/listings/${newListing._id}`);
};
// ---------------- EDIT FORM ----------------
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    const originalImageUrl = listing.image?.url || "/images/default-listing.jpg";

    res.render("listings/edit", { 
        listing, 
        currentUser: req.user,
        originalImageUrl 
    });
};


// ---------------- UPDATE ----------------
module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // Only update owner fields if currentUser is owner
    if (req.user._id.toString() !== listing.owner.toString()) {
        req.flash("error", "You are not authorized");
        return res.redirect(`/listings/${id}`);
    }

    const updatedData = req.body.listing;
    listing.title = updatedData.title;
    listing.description = updatedData.description;
    listing.price = updatedData.price;
    listing.location = updatedData.location;
    listing.country = updatedData.country;
    listing.category = updatedData.category;

    // Update coordinates
    if (updatedData.location) {
        const geoData = await getCoordinates(updatedData.location);
        if (geoData) {
            listing.geometry = { type: "Point", coordinates: [parseFloat(geoData.lon), parseFloat(geoData.lat)] };
        }
    }

    if (req.file) {
        listing.image = { url: req.file.path, filename: req.file.filename };
    }

    await listing.save();
    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
};

// ---------------- DELETE ----------------
module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // Only owner can delete
    if (req.user._id.toString() !== listing.owner.toString()) {
        req.flash("error", "You are not authorized");
        return res.redirect(`/listings/${id}`);
    }

    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted");
    res.redirect("/listings/my");
};
