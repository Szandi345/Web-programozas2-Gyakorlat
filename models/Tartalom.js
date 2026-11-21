const mongoose = require("mongoose");
const tartalomSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    sutiid: { type: Number, required: true },
    mentes: { type: String, required: true }
});

module.exports = mongoose.model("Tartalom", tartalomSchema, "tartalom");
