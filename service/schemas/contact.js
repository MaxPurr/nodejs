const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contact = new Schema({
    name: {
        type: String,
        minlength: 2,
        maxlength: 50,
        required: [true, 'Name is required'],
    },
    email: {
        type: String,
        minlength: 5,
        maxlength: 50,
        unique: true,
        required: [true, 'Email is required'],
    },
    phone:{
        type: String,
        minlength: 5,
        maxlength: 20,
        required: [true, 'Phone is required'],
    },
    favorite:{
        type:Boolean,
        default: false
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'user',
    }
}, { versionKey: false, timestamps: true })

const Contact = mongoose.model("contact", contact);

module.exports = Contact;