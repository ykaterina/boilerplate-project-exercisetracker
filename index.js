const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors');
const router = express.Router();

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Tracker = require("./App.js").TrackerModel;

const addUser = require("./App.js").addNewUser;
app.post("/api/users", function(req, res, next) {
  addUser(req.body.username, function(err, data) {
    if (err) {
      return next(err);
    }
    if (!data) {
      console.log("Missing `done()` argument");
      return next({ message: "Missing callback argument" });
    }
    Tracker.find(data._id, function (err, user) {
      if (err) {
        return next(err);
      }
      res.json({username: user[0].username, _id: user[0]._id});
    });
  });
});

const addLog = require("./App.js").addNewLog;
app.post("/api/users/:_id/exercises", function(req, res, next){
  let userid = req.params._id;
  let exer = new Tracker(req.body);
  exer.save(function(err, log) {
    if (err) {
      return next(err);
    }
  
    try {
      addLog(userid, req.body, function(err, data) { 
        if(err){
          return next(err);
        }
        if(!data) {
          console.log("Missing `done()` argument");
          return next({ message: "Missing callback argument" });
        }
        res.json(data);
      });
    } catch (e) {
      console.log(e);
      return next(e);
    }
  });
});

app.get("/api/users", function(req, res) {
  Tracker.find({}, function(err, users) {
    res.json(users);  
  });
});

const getLogs = require("./App.js").getUserLogs;
app.get("/api/users/:_id/logs?", function(req, res, next) {
  let filters = {};
  if (req.query.hasOwnProperty("from") && req.query.hasOwnProperty("to")){
    filters.from = req.query.from;
    filters.to = req.query.to;
  }
  if (req.query.hasOwnProperty("limit"))
    filters.limit = req.query.limit;
  
  try {
    getLogs(req.params._id, filters, (function(err, data) {
      if(err){
        return next(err);
      }
      if(!data) {
          console.log("Missing `done()` argument");
          return next({ message: "Missing callback argument" });
        }
      res.json(data);
  }));
  } catch (e) {
    console.log(e);
  }
  
});



// Error handler
app.use(function (err, req, res, next) {
  if (err) {
    res
      .status(err.status || 500)
      .type("txt")
      .send(err.message || "SERVER ERROR");
  }
});

// Unmatched routes handler
app.use(function (req, res) {
  if (req.method.toLowerCase() === "options") {
    res.end();
  } else {
    res.status(404).type("txt").send("Not Found");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)

  Tracker.deleteMany({}).then(function(){
    console.log("Data refreshed"); 
    }).catch(function(error){
        console.log(error); // Failure
    });
})

// let existing = (user) => {
//     Tracker.findOne({username: user}, (err, user) => {
//       err ? console.log(err) : done(null, user);
//     });
//   }
