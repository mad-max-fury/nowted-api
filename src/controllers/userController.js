const fs = require("fs");
const AppError = require("../errors/appError");
const { User } = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const { cloudUpload } = require("../utils/cloudinary");
const upload = require("../middlewares/multer");
const userController = {};

// Middleware to upload image
userController.uploadImage = upload.single("image");

// Update user profile
userController.editProfile = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.USER_ID });
  if (!user) {
    return next(new AppError("User Not Found", 403));
  }

  const payload = req.body;

  // Handle image upload
  let imgDet;
  if (req.file) {
    try {
      const file = req.file;
      const { path } = file;
      imgDet = await cloudUpload(path);

      if (!imgDet) {
        fs.unlinkSync(path);
        return next(new AppError("Network Error!", 503));
      }

      fs.unlinkSync(path);
    } catch (err) {
      return next(
        new AppError(
          "Something went wrong while trying to upload an image :(",
          400
        )
      );
    }
  }

  // Prepare updated profile data
  const updatedProfile = {
    userName: payload.userName || user.userName,
    lastName: payload.lastName || user.lastName,
    middleName: payload.middleName || user.middleName,
    firstName: payload.firstName || user.firstName,
    email: payload.email || user.email,
    gender: payload.gender || user.gender,
    profileIcon: imgDet?.url || user.profileIcon,
    age: payload.age || user.age,
  };

  // Update user profile in the database
  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.USER_ID },
      { $set: updatedProfile },
      { new: true }
    );

    if (!updatedUser) {
      return next(new AppError("Problem updating profile!", 400));
    }

    return res.status(200).send({
      message: "Profile Update Successful!",
    });
  } catch (error) {
    return next(new AppError("Problem updating profile!", 400));
  }
});

// Get user details
userController.getMe = catchAsync(async (req, res, next) => {
  const me = await User.findById({ _id: req.USER_ID });
  if (!me) return next(new AppError("Error Retrieving Profile!", 400));

  // Hide sensitive data from the response
  me.password = undefined;
  me.notes = undefined;
  me.createdAt = undefined;
  me.updatedAt = undefined;
  me.token = undefined;
  me.resetPasswordToken = undefined;
  me.resetTokenExpires = undefined;

  res.status(200).send({
    message: "Successfully Retrieved Profile",
    me,
  });
});

module.exports = userController;
