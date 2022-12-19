const express = require("express");
const app = express();

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

//documentation
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      version: "1.0.0",
      title: "Documentación API",
      description: "API Documentacion",
      contact:{
        name: "Daniel B",
        url: "https://www.linkedin.com/in/daniel-barrios-314a74120/"
      },
      servers: ["http://localhost:5000"]
    }
  },
  basePath: "/",
  apis: ["./routes/users.js"]
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

module.exports = app;