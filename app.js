const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
require("dotenv").config();
const PORT = 8080;

//mongo connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Database connection Success.");
})
.catch((err) => {
  console.error("Mongo Connection Error", err);
});

const app = express();

//used of fileupload
app.use(fileUpload())

//used of bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); //optional

app.get("/ping", (req, res) => {
  return res.send({
    error: false,
    message: "Server is healthy",
  });
});

//route to users api
app.use("/users", require("./routes/users"));

//route to api doc
app.use("/api-docs", require("./routes/api"));

app.listen(PORT, () => {
  console.log("Server started listening on PORT : " + PORT);
});
