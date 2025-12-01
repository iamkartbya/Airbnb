const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    image: Joi.alternatives().try(
    Joi.string(),
    Joi.object({
        url: Joi.string(),
        filename: Joi.string()
    }),
    Joi.allow(null),
    Joi.allow("")
   ), 
  }).required(),
});


module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(0).max(5).required(),
    comment: Joi.string().required()
  }).required(),
});
