const mongoose = require("mongoose");
const sutiSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nev: { type: String, required: true },
    tipus: { type: String, required: true },
    dijazott: { type: Boolean, default: false }
});

module.exports = mongoose.model("Suti", sutiSchema, "suti");