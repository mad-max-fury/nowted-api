const AppError = require("../errors/appError");
const { Note } = require("../models/note");
const { User } = require("../models/user");
const catchAsync = require("../utils/catchAsync");

const getAllNotes = catchAsync(async (req, res, next) => {
  const { USER_ID } = req;
  const notes = await Note.find({ user: USER_ID });
  if (notes.length < 1) {
    return next(new AppError("You don't have any notes yet", 404));
  }
  try {
    res.status(200).json({
      data: notes,
    });
  } catch (error) {
    return next(new AppError("Internal Server Error", 500));
  }
});

const getOneNote = catchAsync(async (req, res, next) => {
  const {
    USER_ID,
    params: { noteId },
  } = req;

  const notes = await Note.find({ user: USER_ID });
  const note = notes.find((note) => note._id.toString() === noteId);

  if (!note) {
    return next(new AppError("Note not found", 404));
  }

  res.json({
    data: note,
  });
});

const addNote = catchAsync(async (req, res, next) => {
  const { content, title, important } = req.body;
  const { USER_ID } = req;

  if (!content || !title) {
    return next(new AppError("fields are required", 400));
  }

  try {
    const user = await User.findById(USER_ID);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const note = new Note({
      content,
      title,
      user: user._id,
      important: important || false,
    });

    await note.save();

    user.notes.push(note._id);
    await user.save();

    res.status(201).json({
      msg: "Note added successfully",
    });
  } catch (error) {
    return next(new AppError("Internal Server Error", 500));
  }
});

const updateNote = catchAsync(async (req, res, next) => {
  const {
    params: { noteId },
  } = req;

  try {
    const note = await Note.findByIdAndUpdate(noteId, req.body);

    if (!note) {
      return next(new AppError("Note not found", 404));
    }

    res.status(200).json({
      msg: "Note updated",
    });
  } catch (error) {
    return next(new AppError("Internal Server Error", 500));
  }
});

const deleteNote = catchAsync(async (req, res, next) => {
  const {
    USER_ID,
    params: { noteId },
  } = req;

  const user = await User.findById(USER_ID);

  try {
    const note = await Note.findByIdAndRemove(noteId);

    if (!note) {
      return next(new AppError("Note not found", 404));
    }

    user.notes = user.notes.filter((note) => note._id.toString() !== noteId);
    await user.save();

    res.status(200).json({
      msg: "Note deleted successfully",
    });
  } catch (error) {
    return next(new AppError("Internal Server Error", 500));
  }
});

module.exports = {
  getAllNotes,
  getOneNote,
  addNote,
  updateNote,
  deleteNote,
};
