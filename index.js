const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});
const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: false },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/api/users", (req, res) => {
  User.find({})
    .exec()
    .then((users) => {
      res.json(users);
    })
    .catch((err) => console.error(err));
});

app.post("/api/users", (req, res) => {
  const newUser = new User({
    username: req.body.username,
  });
  newUser
    .save()
    .then((user) => res.json(user))
    .catch((err) => console.error(err));
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const user = await User.findOne({ _id: req.params._id })
    .select("-__v")
    .exec();

  const exercise = new Exercise({
    username: user.username,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date ? new Date(req.body.date) : new Date(),
  });
  await exercise.save();

  const exerciseData = exercise.toObject();
  exerciseData._id = user._id;
  exerciseData.date = exerciseData.date.toDateString();
  res.json(exerciseData);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const user = await User.findOne({ _id: req.params._id })
    .select("-__v")
    .exec();

  const exercises = await Exercise.find({
    username: user.username,
    date: {
      $lte: req.query.to ? new Date(req.query.to) : new Date(),
      $gte: req.query.from ? new Date(req.query.from) : new Date("1900-01-01"),
    },
  })
    .select("-_id -__v -username")
    .limit(req.query.limit ? req.query.limit : 1000)
    .exec();

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises.map((exercise) => {
      const exerciseData = exercise.toObject();
      exerciseData.date = new Date(exerciseData.date).toDateString();
      return exerciseData;
    }),
  });
});

const listener = app.listen(process.env.PORT || 3000, async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error(err));
  console.log("Your app is listening on port " + listener.address().port);
});
