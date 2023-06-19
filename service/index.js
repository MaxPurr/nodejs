const Contact = require('./schemas/contact')
const User = require('./schemas/user')
const jwt = require('jsonwebtoken')

const secret = process.env.SECRET

async function listContacts(user, {page, limit, favorite}) {
    const params = {owner: user};
    if(favorite !== null){
        params.favorite = favorite;
    }
    const contacts = Contact.find(params).skip(limit * (page - 1)).limit(limit);
    return contacts;
}

async function getContactById(user, contactId) {
    return Contact.findOne({ owner:user, _id: contactId })
}

async function removeContact(user, contactId) {
    return Contact.findByIdAndRemove({ owner:user, _id: contactId })
}

async function addContact(body) {
    return Contact.create(body)
}

async function updateContact(user, contactId, body) {
    return Contact.findByIdAndUpdate({ owner:user, _id: contactId }, body, { new: true })
}

async function getUserByEmail(email) {
    return User.findOne({ email })
}

async function validateUserPassword({email, password}){
    const user = await getUserByEmail(email);
    if (!user || !user.validPassword(password)) {
        return null;
    }
    return user;
}

async function registerUser({email, password, avatarURL}){
    console.log({email, password, avatarURL});
    const newUser = new User({ email, avatarURL });
    newUser.setPassword(password);
    newUser.save();
    return newUser;
}

async function loginUser(user){
    const payload = {
        id: user.id,
        username: user.username,
    }
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    await updateUserToken(user.id, token);
    return token;
}

async function updateUserToken(userId, token){
    return User.findByIdAndUpdate({ _id: userId }, {token}, { new: true });
}

async function updateUserSubscription(userId, subscription){
    return User.findByIdAndUpdate({ _id: userId }, {subscription}, { new: true });
}

async function updateUserAvatar(userId, avatarURL){
    return User.findByIdAndUpdate({ _id: userId }, {avatarURL}, { new: true });
}

module.exports = {
    listContacts,
    getContactById,
    removeContact,
    addContact,
    updateContact,
    getUserByEmail,
    validateUserPassword,
    registerUser,
    loginUser,
    updateUserToken,
    updateUserSubscription,
    updateUserAvatar
}