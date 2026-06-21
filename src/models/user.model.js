const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required for creating a user"],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
        unique: [true, "Email already exists."]
    },
    name: {
        type: String,
        required: [true, "Name is required for creating an account"]
    },
    password: {
        type: String,
        required: [true, "Password is required for creating an account"],
        minlength: [6, "password should contain more than 6 character"],
        select: false

    },
    systemUser: {        // to differentiate between user and normal accounts
        type: Boolean,
        default: false,     // account not to be system user account
        immutable: true,
        select: false       // to prevent changes during reading

    }

},

    {
        timestamps: true   //  time of user's creation and updates
    })
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return
    }
    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash
    return
})

userSchema.methods.comparePassword = async function (password) {
    console.log(password, this.password)
    return await bcrypt.compare(password, this.password)
}     // bcrypt returns true or false for password entered by user

const userModel = mongoose.model("user", userSchema)

module.exports = userModel
