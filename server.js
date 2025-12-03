var express = require("express");
var app = express();
var path = require("path");
var fs = require("fs");

require("dotenv").config();  

const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

let db;

// parses json request body
app.use(express.json());

app.set("port", process.env.PORT || 3000);   

// Cors for permitting cross-origin requests
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

// Middleware to log request details
app.use(function(req, res, next) {
    console.log("Request IP: " + req.baseUrl);
    console.log("Request date: " + new Date());
    console.log("Request method: " + req.method);
    next();
});

// Static file server middleware
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

// Datatbase connection
MongoClient.connect(process.env.MONGO_URI, (err, client) => {
    if (err) {
        console.error("Failed to connect to MongoDB", err);
        return;
    }
    db = client.db("webstore");
    console.log("Connected to MongoDB successfully! :)");
});

// Checking the status of the backend server
app.get("/", function(req, res) {
    res.send("Backend server is working");
});

// Get all lessons
app.get("/lessons", (req, res) => {
    console.log(" GET /lessons – fetching ALL lessons");
    db.collection("lessons").find({}).toArray((err, lessons) => {
            if (err) {
                console.error("Error fetching lessons", err);
                res.status(500).json({ error: "Database error" });
                return;
            }
            res.json(lessons);
        });
});

// Update a lesson by id
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

// Search lessons
app.get("/search", (req, res) => {
    const searchTerm = (req.query.q || "").trim();
    console.log(" GET /search – searchTerm:", `"${searchTerm}"`);

    const dbSearch = searchTerm ? {

            $or: [
                { subject:  { $regex: searchTerm, $options: "i" } },
                { location: { $regex: searchTerm, $options: "i" } },
                { desc:     { $regex: searchTerm, $options: "i" } }
            ]
        } : {};

    db.collection("lessons").find(dbSearch).toArray((err, lessons) => {
            if (err) {
                console.error("Error searching lessons", err);
                res.status(500).json({ error: "Database error" });
                return;
            }
            res.json(lessons);
        });
});

// Create new order
app.post("/orders", (req, res) => {
    const body = req.body || {};
    console.log("POST /orders – new order received!");

    const order = {
        name: body.name,
        phone: body.phone,
        email: body.email,

        lessonIds: body.lessonIds || [],   
        lessons: body.lessons || [],     

        totalSpaces: body.totalSpaces || 0,
        orderDate: body.orderDate || new Date().toISOString()
    };

    db.collection("orders").insertOne(order, (err, result) => {
        if (err) {
            console.error("Error inserting order", err);
            res.status(500).json({ error: "Database error" });
            return;
        }
        res.status(201).json(order);
    });
});


// Handles the CORS Option Requests
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 404 handler (no route matched)
app.use(function(req, res) {
    res.status(404);
    res.end("File not found!");
});


app.listen(process.env.PORT || 3000, function() {
    console.log("Server is running on port " + (process.env.PORT || 3000));
});
