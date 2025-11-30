var express = require("express");
var app = express();
var path = require("path");
var fs = require("fs");

require("dotenv").config();  

const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

let db;

app.use(express.json());

app.set("port", process.env.PORT || 3000);   

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    next();
});

MongoClient.connect(process.env.MONGO_URI, (err, client) => {
    if (err) {
        console.error("Failed to connect to MongoDB", err);
        return;
    }
    db = client.db("webstore");
    console.log("Connected to MongoDB successfully! :)");
});

app.use(function(req, res, next) {
    console.log("Request IP: " + req.baseUrl);
    console.log("Request date: " + new Date());
    console.log("Request method: " + req.method);
    next();
});

app.get("/", function(req, res) {
    res.send("Backend server is working");
});
app.use(function(req, res, next) {
    var filepath = path.join(__dirname, "static", req.url);
    fs.stat(filepath, function(err, fileInfo) {
        if (err) {
            next();
            return;
        }
        if (fileInfo.isFile()) res.sendFile(filepath);
        else next();
    });
});

app.use(function(req, res) {
    res.status(404);
    res.end("File not found!");
});
app.get("/lessons", (req, res) => {
    db.collection("lessons")
        .find({})
        .toArray((err, lessons) => {
            if (err) {
                console.error("Error fetching lessons", err);
                res.status(500).json({ error: "Database error" });
                return;
            }
            res.json(lessons);
        });
});
app.put("/lessons/:id", (req, res, next) => {
    db.collection("lessons").update(
        { id: parseInt(req.params.id) },   
        { $set: req.body },                
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e);
            res.send((result.result.n === 1) ? { msg: "success" } : { msg: "error" });
        }
    );
});




app.listen(process.env.PORT || 3000, function() {
    console.log("Server is running on port " + (process.env.PORT || 3000));
});
