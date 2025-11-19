var express = require("express");
var app = express();
var path = require("path");
var fs = require("fs");

app.use(function(req, res, next) {
    console.log("Request IP: "+ req.baseUrl);
    console.log("Request date: "+ new Date());
    next();
});

app.get("/", function(req, res) {
    res.send("Backend server is working");
});

app.use(function(req,res,next){
    var filepath = path.join(__dirname,"static",req.url);
    fs.stat(filepath,function(err,fileInfo){
        if(err){
            next();
            return;
        }
        if(fileInfo.isFile())
            res.sendFile(filepath);
        else
            next();
    });
});
app.use(function(req,res){
    res.status(404);
    res.end("File not found!");
});
app.listen(3000,function(){
    console.log("Server is running on port 3000");
});



