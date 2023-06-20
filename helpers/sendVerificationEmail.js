const {BASE_URL} = process.env;
const sendEmail = require('./sendEmail');

const sendVerificationEmail = async (email, verificationToken) => {
    const verifyEmail = {
        to: email,
        subject:"Verify email",
        html:`<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Verify email</a>`
      }
      await sendEmail(verifyEmail);
}

module.exports = sendVerificationEmail;