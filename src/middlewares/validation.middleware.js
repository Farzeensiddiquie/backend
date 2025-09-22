import Joi from "joi";

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// User validation schemas
export const validateRegister = validate(Joi.object({
  userName: Joi.string().alphanum().min(3).max(30).required(),
 
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  bio: Joi.string().max(500).optional()
}));

export const validateLogin = validate(Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
}));

export const validateProfileUpdate = validate(Joi.object({
 
  bio: Joi.string().max(500).optional(),
  userName: Joi.string().alphanum().min(3).max(30).optional()
}));

// Post validation schemas
export const validatePostCreate = validate(Joi.object({
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).max(5000).required(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional()
}));

export const validatePostUpdate = validate(Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  content: Joi.string().min(1).max(5000).optional(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional()
}));

// Comment validation schemas
export const validateCommentCreate = validate(Joi.object({
  postId: Joi.string().required(),
  content: Joi.string().min(1).max(1000).required()
}));

export const validateCommentUpdate = validate(Joi.object({
  content: Joi.string().min(1).max(1000).required()
}));

export const validateCommentVote = validate(Joi.object({
  voteType: Joi.string().valid('upvote', 'downvote').required()
}));
