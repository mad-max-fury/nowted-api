const mongoose = require("mongoose");
const { Schema } = mongoose;
const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  important: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports.Note = mongoose.model("Note", noteSchema);
