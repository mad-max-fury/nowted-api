// Import dependencies
const { validationResult } = require("express-validator");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../errors/appError");
const { User } = require("../models/user");
const jwt = require("../services/jwt");
const bcrypt = require("../services/bcrypt");
const crypto = require("crypto");
const Email = require("../utils/email");

const userAuth = {};
// User Sign Up
userAuth.signup = catchAsync(async (req, res, next) => {
  const { userName, email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (errors.array()[0].param === "email")
      return next(new AppError("Invalid Email!", 400));
    else
      return next(
        new AppError(
          "Password Must Be At Least 6 Characters And Must Contain A Number",
          400
        )
      );
  }

  const userExist = await User.exists({ email });
  if (userExist)
    return next(new AppError("User With Email Already Exists!", 400));

  // hash passwords
  const passwordHash = await bcrypt.hash(password);

  // save user
  const user = await new User({
    userName,
    email,
    password: passwordHash,
  }).save();

  if (!user) return next(new AppError("Could Not Create User!", 403));

  //send welcome mail
  await new Email(user, "https://google.com").sendWelcome();
  // send response
  res.status(200).send({
    message: "Account created Successfully!",
  });
});
// Login
userAuth.login = catchAsync(async (req, res, next) => {
  // get email and password from form
  const { userName, password } = req.body;
  // if email/username or password is absent return error
  if (!userName || !password)
    return next(
      new AppError("Please Provide Email/UserName And Password!", 400)
    );

  // find user with email or username
  let user =
    (await User.findOne({ email: userName })) ||
    (await User.findOne({ userName: userName }));
  if (!user)
    return next(new AppError("Invalid Email/UserName Or Password!", 400));

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword)
    return next(new AppError("Invalid Email/UserName Or Password!", 400));

  const accessToken = jwt.sign(user.userName);
  user.token = accessToken;
  user = await user.save();

  //send response
  res.status(200).send({
    message: `Welcome back ${user.userName}!`,
    data: {
      userId: user._id,
      token: accessToken,
    },
  });
});
// Logout
userAuth.logout = catchAsync(async (req, res, next) => {
  const { USER_ID } = req;
  // get user
  let user = await User.findById({ _id: USER_ID });
  if (!user)
    return next(new AppError("User Not Found! Something Went Wrong!", 400));
  user.token = "";
  user = await user.save();
  res.sendStatus(200);
});
//
userAuth.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user and validate user
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("User does not exist", 404));
  }
  // Generate random reset token and save it to the user model
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tempPassword = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordToken = tempPassword;
  user.resetTokenExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  // Send the token to the user's email address
  const resetUrl = `${req.protocol}://nowted-one.vercel.app/create-password/${resetToken}`;
  try {
    await new Email(user, resetUrl).sendResetPasswordInstructions();
    //send response back to the user
    return res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (error) {
    console.error(error);
    user.resetPasswordToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "An error occurred while sending mail token, try again later",
        500
      )
    );
  }
});
//reset password
userAuth.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token and validate token expiration
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetTokenExpires: { $gt: Date.now() },
  });

  // If token has expired or is invalid, return an error
  if (!user) {
    return next(new AppError("Invalid token or expired", 400));
  }

  // Set the new password and clear the reset token
  user.password = await bcrypt.hash(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  // Send the response indicating successful password reset
  res.status(200).json({
    status: "success",
    message: "Password reset successful",
  });
});
//update my password
userAuth.updatePassword = catchAsync(async (req, res, next) => {
  const {
    USER_ID,
    body: { oldPassword, newPassword },
  } = req;
  //Get the user from collection
  let user = await User.findById({ _id: USER_ID });
  // validate entered current password
  const isValidPassword = await bcrypt.compare(oldPassword, user.password);
  if (!isValidPassword)
    return next(new AppError("Please Provide a valid Password!", 401));
  //update the password
  user.password = await bcrypt.hash(newPassword);
  await user.save();
  // log User in, and send new JWT token
  return res.status(200).json({
    status: "success",
    message: "User password successfully",
  });
});

module.exports = userAuth;
