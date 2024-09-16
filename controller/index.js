const service = require("../service");
const { HttpError, sendVerificationEmail } = require("../helpers");
const gravatar = require("gravatar");
const path = require('path');
const fs = require('fs').promises;
const jimp = require("jimp");
const {nanoid} = require("nanoid");

const passport = require('passport')
const Joi = require("joi");

const avatarsDir = path.join(__dirname,"../","public","avatars");

const userSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

const subscriptionSchema = Joi.object({
  subscription: Joi.string().required().valid('starter', 'pro', 'business'),
});

const userEmailSchema = Joi.object({
  email: Joi.string().required(),
});

const auth = async (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!user || err || !user.token) {
      return res.status(401).json({
        message: 'Unauthorized',
      })
    }
    req.user = user;
    next()
  })(req, res, next)
}

const getListContacts = async (req, res, next) => {
  const user = req.user;
  const { page = 1, limit = 20, favorite = null } = req.query;
  console.log({ page , limit , favorite });
  try {
    const contacts = await service.listContacts(user, { page , limit , favorite });
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
};

const getContactById = async (req, res, next) => {
  const { contactId } = req.params;
  const user = req.user;
  try {
    const contact = await service.getContactById(user, contactId);
    if (!contact)
      throw HttpError(404, `Сontact with id:${contactId} not found.`);
    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
};

const addContact = async (req, res, next) => {
  const user = req.user;
  try {
    let body = req.body;
    body.owner = user;
    const result = await service.addContact(body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const removeContact = async (req, res, next) => {
  const { contactId } = req.params;
  const user = req.user;
  try {
    const contact = await service.removeContact(user,contactId);
    if (!contact)
      throw HttpError(404, `Сontact with id:${contactId} not found.`);
    res.status(200).json({ message: "Contact deleted." });
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  const { contactId } = req.params;
  const user = req.user;
  const {name,email,phone, favorite = false} = req.body;
  try {
    const contact = await service.updateContact(user, contactId, {name,email,phone,favorite});
    if (!contact)
      throw HttpError(404, `Сontact with id:${contactId} not found.`);
    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
};

const updateContactStatus = async(req, res, next) =>{
  const { contactId } = req.params;
  const user = req.user;
  const {favorite = false} = req.body;
  try{
    const contact = await service.updateContact(user, contactId, {favorite});
    if (!contact)
      throw HttpError(404, `Сontact with id:${contactId} not found.`);
    res.status(200).json(contact);
  }
  catch (error) {
    next(error);
  }
}

const registerUser = async(req, res, next) => {
  const body = req.body;
  const {email} = body;
  try{
    const {error} = userSchema.validate(body);
    if(error)
      throw HttpError(400, error.message);
    const user = await service.getUserByEmail(email);
    if (user)
      throw HttpError(409, `Email is already in use.`); 
    const avatarURL = gravatar.url(email);
    const verificationToken = nanoid();
    const newUser = await service.registerUser({...body, avatarURL, verificationToken});

    sendVerificationEmail(email,verificationToken);

    res.status(201).json({user:{
      email:newUser.email,
      subscription:newUser.subscription,
      avatarURL:newUser.avatarURL,
    }});
  }
  catch (error) {
    next(error);
  }
}

const loginUser = async(req, res, next) => {
  const body = req.body;
  try{
    const {error} = userSchema.validate(body);
    if(error)
      throw HttpError(400, error.message);
    const user = await service.validateUserPassword(body);
    if (!user)
      throw HttpError(401, `Email or password is wrong.`); 
    if(!user.verify)
      throw HttpError(500, `The user's account has not been verified.`); 
    const token = await service.loginUser(user);
    res.status(200).json({token,
      user:{
        email:user.email,
        subscription:user.subscription
      }
    });
  }
  catch (error) {
    next(error);
  }
}

const logout = async(req, res, next) =>{
  const user = req.user;
  try{
    await service.updateUserToken(user.id, null);
    res.status(200).json({message: "The token has been deleted."});
  }
  catch (error) {
    next(error);
  }
}

const getUser = async(req, res, next) =>{
  const {email, subscription} = req.user;
  res.status(200).json({email, subscription});
}

const updateUserSubscription = async(req, res, next) =>{
  const user = req.user;
  const {_id} = user;
  const body = req.body;
  try{
    const {error} = subscriptionSchema.validate(body);
    if(error)
      throw HttpError(400, error.message);
    await service.updateUserSubscription(_id, body.subscription);
    res.status(200).json({
      email:user.email,
      subscription: body.subscription});
  }
  catch(error){
    next(error);
  }
}

const updateUserAvatar = async(req, res, next) =>{
  const {_id} = req.user;
  const {path: tempUpload, originalname} = req.file;
  try{
    const image = await jimp.read(tempUpload);
    await image.resize(250, 250, jimp.AUTO);
    await image.writeAsync(tempUpload);

    const newName = `${_id}_${originalname}`;
    const resultUpload = path.join(avatarsDir, newName);
    await fs.rename(tempUpload,resultUpload);
    const avatarURL = path.join("avatars", newName);
    await service.updateUserAvatar(_id, avatarURL);
    res.status(200).json({
      avatarURL,
    });
  }
  catch(error){
    next(error);
  }
}

const verifyToken = async(req, res, next) =>{
  const { verificationToken } = req.params;
  try{
    const user = await service.getUserByVerificationToken(verificationToken);
    if(!user){
      throw HttpError(404, 'User not found');
    }
    const {_id} = user;
    await service.updateUserVerificationToken(_id,null);
    await service.updateUserVerify(_id,true);
    res.status(200).json({
      message: 'Verification successful',
    });
  }
  catch(error){
    next(error);
  }
}

const sendEmailValidation = async(req, res, next) =>{
  const body = req.body;
  try{
    const {error} = userEmailSchema.validate(body);
    if(error)
      throw HttpError(400,"Missing required field email");
    const {email} = body;
    const user = await service.getUserByEmail(email);
    if(!user)
      throw HttpError(404, 'User not found');
    if(user.verify)
      throw HttpError(404, 'Verification has already been passed');
    sendVerificationEmail(email, user.verificationToken);
    res.status(200).json({
      message: "Verification email sent",
    });
  }
  catch(error){
    next(error);
  }
}

module.exports = {
  getListContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
  updateContactStatus,
  registerUser,
  loginUser,
  logout,
  getUser,
  updateUserSubscription,
  updateUserAvatar,
  verifyToken,
  sendEmailValidation,
  auth
};
