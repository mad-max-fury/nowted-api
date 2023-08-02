const router = require("express").Router();
const { body } = require("express-validator");
const { auth } = require("../middlewares/auth");
const authController = require("../controllers/authController");
const noteController = require("../controllers/notesController");
const userController = require("../controllers/userController");
const passport = require("passport");

// create user
router.post(
  "/signUp",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }).matches(/\d/),
  authController.signup
);
// login
router.post("/login", authController.login);
// logout
router.get("/logout", auth, authController.logout);
//forgot password
router.post("/forgotPassword", authController.forgotPassword);
//reset password
router.patch("/resetPassword/:resetToken", authController.resetPassword);
// update password
router.patch("/updatePassword", auth, authController.updatePassword);

//Google auth with passport
router.get("/login/success", (req, res) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      message: "successfull",
      user: req.user,
      //   cookies: req.cookies
    });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "failure",
  });
});
router.get(
  "/login/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login/failure",
    successRedirect:
      process.env.NODE_ENV === "production"
        ? ""
        : "http://localhost:3000/dashboard",
  })
);
// edit profile
router.patch(
  "/updateProfile",
  auth,
  userController.uploadImage,
  userController.editProfile
);
// update profile
router.get("/user", auth, userController.getMe);
// create note
router.post("/createNote", auth, noteController.addNote);
// update a note
router.patch("/updateNote/:noteId", auth, noteController.updateNote);
// delete a note
router.delete("/deleteNote/:noteId", auth, noteController.deleteNote);
// fetch all users notes
router.get("/notes", auth, noteController.getAllNotes);
// get one post
router.get("/notes/:noteId", auth, noteController.getOneNote);
module.exports = router;
