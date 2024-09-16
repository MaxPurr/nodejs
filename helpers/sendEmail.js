const {SENDGRID_API_KEY, BASE_EMAIL} = process.env;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async (data) =>{
    const email = {...data, from:BASE_EMAIL}
    await sgMail.send(email);
    return true;
}

module.exports = sendEmail;