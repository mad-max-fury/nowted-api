const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    notes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Note",
      },
    ],

    lastName: {
      type: String,
    },
    token: {
      type: String,
    },
    middleName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    firstName: {
      type: String,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
    },
    profileIcon: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetTokenExpires: {
      type: Date,
    },
    googleId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports.User = mongoose.model("User", userSchema);
