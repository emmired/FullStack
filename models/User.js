const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    }
}, { timestamps: true });

//Hash the password before saving the user

userSchema.pre("save", async function (next) {
    if (this.isModified("password") || this.isNew) {
        this.password = await bcrypt.hash(this.password, 10)
        console.log(this.password);

    }
    next()
})

//Method to validate password

userSchema.method.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
};

const User = mongoose.model('User', userSchema);
module.exports = User;
