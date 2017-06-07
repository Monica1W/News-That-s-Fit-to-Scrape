// Dependencies
var express = require("express");
var bodyParser = require("body-parser")
var exphbs = require("express-handlebars")
var mongoose = require("mongoose")
var methodOverride = require("method-override")
var path = require("path");
// models
var note = require("./models/note.js");
var Article = require("./models/article.js");
//request and cheerio
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;
var PORT = process.env.PORT || 443;

// Initialize Express
var app = express();

// Setting up the Express app to handle data parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));


app.use(express.static(process.cwd() + "/public"));

// Overriding with POST having ?_method=DELETE
app.use(methodOverride("_method"));

//Database configuration with Mongoose local MongoDB URI
var databaseUri = "mongodb://localhost/articlesDB";

if (process.env.MONGODB_URI) {
  //HEROKU APP
mongoose.connect(process.env.MONGODB_URI);

} else {
  //local machine
mongoose.connect(databaseUri);
}
//-------------------End database configuration--------------------------

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

//log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


//handlebars
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");


// Scrape data from NYTimes 
app.get("/scrape", function(req, res) {
  
  request("https://www.nytimes.com/", function(error, response, html) {
    
    var $ = cheerio.load(html);

    $("article h2").each(function(i, element) {

      
      var result = {};

      
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

    
      var entry = new Article(result);

     
      entry.save(function(err, doc) {
          if (error) {
           
            console.log(error);
          }
          
          else {
          
            console.log(doc);
          }
        });
      
    });
  });

  // show articles list
  res.redirect("/");
});

//get the articles we scraped from the mongoDB
app.get("/", function(req, res) {
  
  Article.find({}, function(error, doc) {
   
    if (error) {
      console.log(error);
    }
    
    else {
        res.render("index", {
           article: doc
        });
      }
  });
});

app.put("/:id", function(req, res) {
  // find and update it's status to "saved"
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": req.body.saved })
  
    .exec(function(err, doc) {
     
      if (err) {
        console.log(err);
      }
      else {
        
        console.log(doc);
      }
    });
    res.redirect("/");
});

app.get("/saved", function(req, res) {
  //Articles array that is saved
  Article.find({ saved: true }, function(error, doc) {
    
    if (error) {
      console.log(error);
    }

    
    else {
      var articleObj = {
        article: doc
      };
      res.render("saved", articleObj);
    }
  });
});


app.put("/delete/:id", function(req, res) {
  // Delete an article
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": req.body.saved })
  
    .exec(function(err, doc) {
      
      if (err) {
        console.log(err);
      }
      else {
        
        console.log(doc);
      }
    });
  res.redirect("/saved");
});

// Grab an article by it's ObjectId
app.get("/saved/:id", function(req, res) {
  
  Article.findOne({ "_id": req.params.id })
  
  .populate("note")
  
  .exec(function(error, doc) {
    
    if (error) {
      console.log(error);
    }
    
    else {
      res.json(doc);
    }
  });
});

// Create a new note or replace an existing note
app.post("/submit", function(req, res) {
  
  var newNote = new Note(req.body);
  var currentArticleID = req.params.id;
  
  newNote.save(function(error, doc) {

   
    if (error) {
      res.send(error);
    }
    
    else {
      
      Article.findOneAndUpdate({}, { $push: { "notes": doc._id } }, { new: true}, function(error, newdoc)  {

       
        if (err) {
          res.send(err);
        }
        else {
          
          res.send(newdoc);
        }
      });
    }
  });
});

app.get("/saved/:id", function(req, res) {
  // Grab every doc in the Articles array that is saved
  note.find({ saved: true }, function(error, doc) {
    
    if (error) {
      console.log(error);
    }
    
    else {
      var articleObj = {
        article: doc
      };
      res.render("saved", articleObj);
    }
  });
});
// Route to see notes we have added
app.get("/notes", function(req, res) {
  
  Note.find({}, function(error, doc) {
    
    if (error) {
      res.send(error);
    }
    
    else {
      res.send(doc);
    }
  });
});
// Listen on port 443
app.listen(PORT, function() {
  console.log("App running on port " + PORT);
});
 





































    