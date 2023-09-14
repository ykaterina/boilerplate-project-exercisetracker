require('dotenv').config()
const express = require('express')
const app = express()

const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);

mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to MongoDB");
  }
);

const exerciseTrackerSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: []
});

let Tracker = mongoose.model("ExerciseLog", exerciseTrackerSchema);

const addNewUser = (user, done) => {
  let NewUser = new Tracker({
    username: user,
    count: 0,
    log: []
  });

  NewUser.save(function(err, data) {
    err ? console.log(err) : done(null, { username: data.username, _id: data._id });
  });
};

const addNewLog = (id, log, done) => {
  let date = log.date ? new Date(log.date).toDateString() : new Date().toDateString();

  let newlog = {
    description: log.description,
    duration: parseInt(log.duration),
    date: date
  }

  Tracker.findOneAndUpdate({ _id: id },
    { $push: { log: newlog } }, { returnOriginal: false }, function(err, user) {
      err ? console.log(err)
        : done(null,
          {
            username: user.username,
            description: newlog.description,
            duration: newlog.duration,
            date: newlog.date,
            _id: user.id
          }
        );
    });
};

const getUserLogs = (id, options, done) => {
  Tracker.findOne({ _id: id }, (function(err, logs) {
    if (err)
      console.log(err);

    let userlog = {
      username: logs.username,
      count: 0,
      _id: logs._id,
      log: []
    }

    logs.log.forEach(function(exercise) {
      newDate = (exercise.date == 'Invalid Date')
        ? new Date().toDateString()
        : new Date(exercise.date).toDateString()

      if (options.from && options.to) {
        let fromDate = new Date(options.from);
        let toDate = new Date(options.to);

        if (new Date(newDate) >= fromDate && new Date(newDate) <= toDate) {
          userlog.log.push({
            description: exercise.description,
            duration: exercise.duration,
            date: newDate,
          });
          userlog.count++;
        }
      } else {
        userlog.log.push({
          description: exercise.description,
          duration: exercise.duration,
          date: newDate,
        });
        userlog.count++;
      }
    });

    if (options.limit && (options.limit < userlog.log.length))
      userlog.log.splice(0, parseInt(options.limit));
    done(null, userlog);
  }));
};

exports.TrackerModel = Tracker;
exports.addNewUser = addNewUser;
exports.addNewLog = addNewLog;
exports.getUserLogs = getUserLogs;