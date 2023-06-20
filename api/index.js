const express = require("express");
const {upload} = require("../middlewares")

const router = express.Router();

const {
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
} = require("../controller");

router.get("/contacts", auth, getListContacts);

router.get("/contacts/:contactId", auth, getContactById);

router.post("/contacts",auth, addContact);

router.delete("/contacts/:contactId",auth, removeContact);

router.put("/contacts/:contactId",auth, updateContact);

router.patch("/contacts/:contactId/favorite",auth, updateContactStatus);

router.post("/users/register", registerUser)

router.post("/users/login", loginUser)

router.post("/users/logout",auth, logout)

router.get("/users/current",auth, getUser)

router.patch("/users",auth, updateUserSubscription)

router.patch("/users/avatars",auth, upload.single("avatar"), updateUserAvatar)

router.get("/users/verify/:verificationToken", verifyToken)

router.post("/users/verify", sendEmailValidation)


module.exports = router;
