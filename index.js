const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
const mongoose = require("mongoose");

const mySecret = process.env["MONGO_URI"];
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const { Schema } = mongoose;

const personSchema = new Schema({
  username: { type: String, unique: true },
});

const Person = mongoose.model("Person", personSchema);

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});

const Exercise = mongoose.model("Exercises", exerciseSchema);

const logSchema = new Schema({
  username: String,
  count: Number,
  log: Array,
});

const Log = mongoose.model("Log", logSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//create a new user
app.post("/api/users", (req, res) => {
  const newPerson = new Person({ username: req.body.username });

  newPerson.save((err, data) => {
    if (err) {
      res.json("username already exists");
    } else {
      res.json({ username: data.username, _id: data.id });
    }
  });
});

//create a new exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  let idJson = { id: req.params._id };
  let checkedDate = new Date(req.body.date);
  let idToCheck = idJson.id;

  let noDateHandler = () => {
    if (checkedDate instanceof Date && !isNaN(checkedDate)) {
      return checkedDate;
    } else {
      checkedDate = new Date();
    }
  };
  Person.findById(idToCheck, (err, data) => {
    noDateHandler(checkedDate);
    if (err) {
      console.log("error with id =>", err);
    } else {
      const test = new Exercise({
        username: data.username,
        description: req.body.description,
        duration: req.body.duration,
        date: checkedDate.toISOString(),
      });
      test.save((err, data) => {
        if (err) {
          console.log("error with saving exercise =>", err);
        } else {
          console.log("exercise saved");
          res.json({
            _id: idToCheck,
            username: data.username,
            description: data.description,
            duration: data.duration,
            date: data.date.toDateString(),
          });
        }
      });
    }
  });
});

// get  exercises for a user
app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  let idJson = { id: req.params._id };
  let idToCheck = idJson.id;

  Person.findById(idToCheck, (err, data) => {
    var query = { username: data.username };

    if (from !== undefined && to === undefined) {
      query.data = { $gte: new Date(from) };
    } else if (to !== undefined && from === undefined) {
      query.data = { $lte: new Date(to) };
    } else if (from !== undefined && to !== undefined) {
      query.data = { $gte: new Date(from), $lte: new Date(to) };
    }

    let limitChecker = (limit) => {
      let maxLimit = 100;
      if (limit) {
        return limit;
      } else {
        return maxLimit;
      }
    };

    if (err) {
      console.log("error with ID=>", err);
    } else {
      Exercise.find(
        (query),
        null,
        { limit: limitChecker(+limit) },
        (err, docs) => {
          //let loggedArray = [];
          if (err) {
            console.log("error with query=>", err);
          } else {
            let documnets = docs;
            let loggedArray = documnets.map((item) => {
              return {
                description: item.description,
                duration: item.duration,
                date: item.date.toDateString(),
              };
            });

            const test = new Log({
              username: data.username,
              count: loggedArray.length,
              log: loggedArray,
            });
            test.save((err, data) => {
              if (err) {
                console.log("error with log=>", err);
              } else {
                console.log("log saved");
                res.json({
                  _id: data._id,
                  username: data.username,
                  count: data.count,
                  log: data.log,
                });
              }
            });
          }
        }
      );
    }
  });
});

app.get("/api/users", (req, res) => {
  Person.find((err, data) => {
    res.json(data);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
