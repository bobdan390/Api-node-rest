const express = require("express");
const router = express.Router();
const cleanBody = require("../middlewares/cleanbody");
const { validateToken } = require("../middlewares/validateToken");
const AuthController = require("../src/users/user.controller");

//Define endpoints
/**
 * @swagger
 * /users/signup:   
 *   post:  
 *       summary: register a user
 *       description: Use for register the users
 *       produces: 
 *           - application/json
 *       parameters: 
 *           email: text
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.post("/signup", cleanBody, AuthController.Signup);

/**
 * @swagger
 * /users/activate:   
 *   post:  
 *       summary: activate a user
 *       description: Use for activate the users
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: body
 *           name: email
 *           description: a field
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.patch("/activate", cleanBody, AuthController.Activate);

/**
 * @swagger
 * /users/login:   
 *   post:  
 *       summary: login
 *       description: Use for login the users
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: body
 *           name: email
 *           description: a field
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.post("/login", cleanBody, AuthController.Login);

/**
 * @swagger
 * /users/forgot:   
 *   patch:  
 *       summary: forgot the users
 *       description: Use for forgot the users
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: body
 *           name: email
 *           description: a field
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.patch("/forgot",cleanBody, AuthController.ForgotPassword);

/**
 * @swagger
 * /users/reset:   
 *   patch:  
 *       summary: reset the users
 *       description: Use for reset the users
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: token
 *           name: token
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.patch("/reset",cleanBody,AuthController.ResetPassword);

/**
 * @swagger
 * /users/logout:   
 *   get:  
 *       summary: logout the users
 *       description: Use for logout the users
 *       produces: 
 *           - application/json
 *       parameters: 
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.get("/logout", validateToken, AuthController.Logout);

/**
 * @swagger
 * /users/upload:   
 *   post:  
 *       summary: upload archives
 *       description: Use for upload archives
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: body
 *           name: file
 *           description: a field
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.post("/upload", cleanBody, AuthController.Upload);

/**
 * @swagger
 * /users/transfer:   
 *   post:  
 *       summary: transfer
 *       description: Use for transfer archives
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: body
 *           name: urlImagen
 *           description: a field
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.post("/transfer", validateToken, AuthController.TransferImg);

/**
 * @swagger
 * /users/archives:   
 *   get:  
 *       summary: list archives
 *       description: Use for list archives
 *       produces: 
 *           - application/json
 *       parameters:
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.get("/archives", validateToken, AuthController.Archives);

/**
 * @swagger
 * /users/getUrl/{id}:   
 *   get:  
 *       summary: get a archive
 *       description: Use for get a archive url
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: path
 *           name: id
 *           description: a field
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.get("/getUrl/:id", validateToken, AuthController.getUrl);

/**
 * @swagger
 * /users/search:   
 *   post:  
 *       summary: search a img
 *       description: Use for search a img
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: body
 *           name: q
 *           description: a field
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
router.post("/search", validateToken, AuthController.Search);

/**
 * @swagger
 * /users/update:   
 *   post:  
 *       summary: update a user
 *       description: Use for update the users
 *       produces: 
 *           - application/json
 *       parameters: 
 *           -in: body
 *           name: email
 *           description: a field
 *       responses:
 *           200:
 *               description: Request success
 *               type: json
 *               schemma: 
 */
 router.post("/update", validateToken, AuthController.Update);

module.exports = router;
