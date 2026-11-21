const mongoose = require("mongoose");
const uzenetSchema = new mongoose.Schema({
    nev: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    uzenet: {
        type: String,
        required: true,
        trim: true
    },
    datum: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model("Uzenet", uzenetSchema, "uzenetek");