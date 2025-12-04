const User = require("../models/user");
const { cloudinary } = require("../cloudConfig");

// ------------------ SIGNUP ------------------
module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ email, username, name: username });

        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

// ------------------ LOGIN ------------------
module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
    req.flash("success", "Welcome back!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.locals.redirectUrl = null;
    res.redirect(redirectUrl);
};

// ------------------ LOGOUT ------------------
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};

// ------------------ PROFILE ------------------
module.exports.showProfile = (req, res) => {
    if (!req.user) return res.redirect("/login");
    res.render("users/profile", { currentUser: req.user });
};

module.exports.renderEditProfileForm = (req, res) => {
    if (!req.user) return res.redirect("/login");
    res.render("users/editProfile", { currentUser: req.user });
};

module.exports.updateProfile = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    const { name, email } = req.body;

    const updatedData = { 
        name,
        email
    };

    // If new avatar uploaded
    if (req.file) {
        updatedData.avatar = req.file.path;  // ⭐ Cloudinary URL
    }

    await User.findByIdAndUpdate(req.user._id, updatedData, { new: true });

    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");
};
