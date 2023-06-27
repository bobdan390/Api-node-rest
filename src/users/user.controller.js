const Joi = require("joi");
require("dotenv").config();
const { v4: uuid } = require("uuid");
const { sendEmail } = require("./helpers/mailer");
const User = require("./user.model");
const Archive = require("./archive.model.js");
const Boat = require("./boat.model.js");
const { generateJwt } = require("./helpers/generateJwt");

const AWS  = require('aws-sdk');
const fs   = require('fs');
const path = require('path');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

//Validate user schema
const userSchema = Joi.object().keys({
  email: Joi.string().email({ minDomainSegments: 2 }),
  password: Joi.string().required().min(4),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

//register a user
exports.Signup = async (req, res) => {
  try {
    const result = userSchema.validate(req.body);
    if (result.error) {
      console.log(result.error.message);
      return res.json({
        error: true,
        status: 400,
        message: result.error.message,
      });
    }
    //Check if the email has been already registered.
    var user = await User.findOne({
      email: result.value.email,
    });
    if (user) {
      return res.json({
        error: true,
        message: "Email is already in use",
      });
    }
    const hash = await User.hashPassword(result.value.password);
    const id = uuid(); //Generate unique id for the user.
    result.value.userId = id;
   //remove the confirmPassword field from the result as we dont need to save this in the db.
   delete result.value.confirmPassword;
   result.value.password = hash;
    let code = Math.floor(100000 + Math.random() * 900000);  //Generate random 6 digit code.                             
    let expiry = Date.now() + 60 * 1000 * 15;  //Set expiry 15 mins ahead from now
    const sendCode = await sendEmail(result.value.email, code);
    if (sendCode.error) {
      return res.status(500).json({
        error: true,
        message: "Couldn't send verification email.",
      });
    }
    result.value.emailToken = code;
    result.value.emailTokenExpires = new Date(expiry);

    result.value.active = true;

    const newUser = new User(result.value);
    await newUser.save();
    return res.status(200).json({
      success: true,
      message: "Registration Success",
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      error: true,
      message: "Cannot Register",
    });
  }
};

//login a user
exports.Login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          error: true,
          message: "Cannot authorize user.",
        });
      }
      //1. Find if any account with that email exists in DB
      const user = await User.findOne({ email: email });
      // NOT FOUND - Throw error
      if (!user) {
        return res.status(404).json({
          error: true,
          message: "Account not found",
        });
      }
      //2. Throw error if account is not activated
      if (!user.active) {
        return res.status(400).json({
          error: true,
          message: "You must verify your email to activate your account",
        });
      }
      //3. Verify the password is valid
      const isValid = await User.comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(400).json({
          error: true,
          message: "Invalid credentials",
        });
      }

      //Generate Access token
      const { error, token } = await generateJwt(user.email, user.userId);
      if (error) {
        return res.status(500).json({
          error: true,
          message: "Couldn't create access token. Please try again later",
        });
      }
      user.accessToken = token;

      await user.save();
      
      //Success
      return res.send({
        success: true,
        message: "User logged in successfully",
        accessToken: token,  //Send it to the client
        user: user
       });
    } catch (err) {
      console.error("Login error", err);
      return res.status(500).json({
        error: true,
        message: "Couldn't login. Please try again later.",
      });
    }
};

//activate a user
exports.Activate = async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.json({
          error: true,
          status: 400,
          message: "Please make a valid request",
        });
      }
      const user = await User.findOne({
        email: email,
        emailToken: code,
        emailTokenExpires: { $gt: Date.now() }, // check if the code is expired
      });
      if (!user) {
        return res.status(400).json({
          error: true,
          message: "Invalid details",
        });
      } else {
        if (user.active)
          return res.send({
            error: true,
            message: "Account already activated",
            status: 400,
          });
        user.emailToken = "";
        user.emailTokenExpires = null;
        user.active = true;
        await user.save();
        return res.status(200).json({
          success: true,
          message: "Account activated.",
        });
      }
    } catch (error) {
      console.error("activation-error", error);
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
};

//forgot a password
exports.ForgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.send({
          status: 400,
          error: true,
          message: "Cannot be processed",
        });
      }
      const user = await User.findOne({
        email: email,
      });
      if (!user) {
        return res.send({
          success: true,
          message:
            "If that email address is in our database, we will send you an email to reset your password",
        });
      }
      let code = Math.floor(100000 + Math.random() * 900000);
      let response = await sendEmail(user.email, code, "Forgot your password", "Your code for reset your password is ");
      if (response.error) {
        return res.status(500).json({
          error: true,
          message: "Couldn't send mail. Please try again later.",
        });
      }
      let expiry = Date.now() + 60 * 1000 * 15;
      user.resetPasswordToken = code;
      user.resetPasswordExpires = expiry; // 15 minutes
      await user.save();
      return res.send({
        success: true,
        message:
          "If that email address is in our database, we will send you an email to reset your password",
      });
    } catch (error) {
      console.error("forgot-password-error", error);
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
};

//reset a password
exports.ResetPassword = async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      if (!token || !newPassword || !confirmPassword) {
        return res.status(403).json({
          error: true,
          message:
            "Couldn't process request. Please provide all mandatory fields",
        });
      }
      const user = await User.findOne({
        resetPasswordToken: req.body.token,
        resetPasswordExpires: { $gt: Date.now() },
      });
      if (!user) {
        return res.send({
          error: true,
          message: "Password reset token is invalid or has expired.",
        });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          error: true,
          message: "Passwords didn't match",
        });
      }
      const hash = await User.hashPassword(req.body.newPassword);
      user.password = hash;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = "";
      await user.save();
      return res.send({
        success: true,
        message: "Password has been changed",
      });
    } catch (error) {
      console.error("reset-password-error", error);
      return res.status(500).json({
        error: true,
        message: error.message,
      });
    }
};

exports.Logout = async (req, res) => {
  try {
    const { id } = req.decoded;
    let user = await User.findOne({ userId: id });
    user.accessToken = "";
    await user.save();
    return res.send({ success: true, message: "User Logged out" });
  } catch (error) {
    console.error("user-logout-error", error);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};

//logout a user
exports.Upload = async (req, res) => {
  
  AWS.config.update({
      accessKeyId: process.env.ACCESS_KEY_AWS,
      secretAccessKey: process.env.SECRET_KEY_AWS,
      region: 'us-east-1' 
  });

  var s3 = new AWS.S3();
  //const { id } = req.decoded;
 
  try {
    
    let EDFile = req.files.file
    var filePath = `./data/${EDFile.name}`;
    EDFile.mv(filePath,err => {
        if(err) return res.status(500).send({ message : err })
  
        //configurar parametros
        var params = {
          Bucket : process.env.BUCKET,
          Body   : fs.createReadStream(filePath),
          Key    : "folder/" + Date.now() + "_" + path.basename(filePath),
          ACL    : 'public-read'
        };
  
        s3.upload(params, async (err, data) => {
          //en caso de error
          if (err) {
            console.log("Error", err);
            return res.stat(500).json({
              error: true,
              message: "Error al subir el archivo",
            });
          }
    
          // el archivo se ha subido correctamente
          if (data) {
            const id_archive = uuid();
            console.log("Uploaded in:", data.Location);
            /* const newUser = new Archive({
              archiveId: id_archive,
              userId: id,
              url: data.Location
            });
            await newUser.save(); */
            return res.send({ success: true, message: "Upload success", url: data.Location });
          }
        });
    })
   
  } catch (error) {
    console.error("user-upload-error", error);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};

//transfer img from aby url
exports.TransferImg = async (req, res) => {
  
  AWS.config.update({
      accessKeyId: process.env.ACCESS_KEY_AWS,
      secretAccessKey: process.env.SECRET_KEY_AWS,
      region: 'us-east-1' 
  });

  var s3 = new AWS.S3();
  
  const { id } = req.decoded;
 
  try {
  
    const { urlImagen } = req.body;
    if (!urlImagen) {
      return res.status(400).json({
        error: true,
        message: "urlImagen is missing.",
      });
    }

    const _res = await fetch(urlImagen);
    const blob = await _res.buffer();

    //configurar parametros
    var params = {
      Bucket : process.env.BUCKET,
      Body   : blob,
      Key    : "folder/" + urlImagen.split("/")[ urlImagen.split("/").length - 1 ],
      ACL    : 'public-read'
    };

    s3.upload(params, async (err, data) => {
      //en caso de error
      if (err) {
        console.log("Error", err);
        return res.stat(500).json({
          error: true,
          message: "Error al subir la imagen",
        });
      }

      // el archivo se ha subido correctamente
      if (data) {
        const id_archive = uuid();
        console.log("Uploaded in:", data.Location);
        const newUser = new Archive({
          archiveId: id_archive,
          userId: id,
          url: data.Location
        });
        await newUser.save();
        return res.send({ success: true, message: "Upload success" });
      }
    });

   
  } catch (error) {
    console.error("user-upload-error", error);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};

//list archives user
exports.Archives = async (req, res) => {
  
  try {
    
    const { id } = req.decoded;
    let archives = await Boat.find({ userId: id });

    return res.status(200).json({
      success: true,
      data: archives
    });
   
  } catch (error) {
    console.error("user-archives-error", error);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};

//get a record archive
exports.getUrl = async (req, res) => {
  
  try {
    
    const { id } = req.params;
    let archive = await Archive.findOne({ archiveId: id });

    return res.status(200).json({
      success: true,
      url: archive
    });
   
  } catch (error) {
    console.error("user-archives-error", error);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};

//search imagens in api unplash
exports.Search = async (req, res) => {
  
  try {
    
    const { q } = req.body;

    const rawResponse = await fetch(`${process.env.API_URL_SEARCH_PHOTOS}?client_id=${process.env.API_SEARCH_PHOTOS}&query=${q}`);
    const content = await rawResponse.json();

    return res.status(200).json({
      success: true,
      data: content
    });
   
  } catch (error) {
    console.error("user-archives-error", error);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};

//update a user
exports.Update = async (req, res) => {
  try {
    const { userId, name, birth, country, lang, pic } = req.body;
    if (name==null || birth==null || country==null || lang==null || pic==null) {
      return res.json({
        error: true,
        status: 400,
        message: "Please make a valid request",
      });
    }
    const { id } = req.decoded;
    let user = await User.findOne({ userId: id });
    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid details",
      });
    } else {
      user.name = name;
      user.birth = birth;
      user.country = country;
      user.lang = lang;
      user.pic = pic;
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Account updated.",
        user: user
      });
    }
  } catch (error) {
    console.error("update-error", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};


//transfer img from aby url
exports.Saveboat = async (req, res) => {
  try {
    const { 
      userId, 
      pic, 
      make, 
      model, 
      length, 
      unit_lenght,
      year,
      boat_type,
      boat_material,
      price,
      unit_price,
      vessel_name,
      home_port,
      location,
      published 
    } = req.body;

    if (userId==null) {
      return res.json({
        error: true,
        status: 400,
        message: "Please make a valid request asdasd",
      });
    }
    const { id } = req.decoded;
    let user = await User.findOne({ userId: id });
    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid details",
      });
    } else {
      
      const boat = new Boat({
        userId: id,
        pic: pic,
        make: make,
        model : model,
        length : length,
        unit_lenght : unit_lenght,
        year : year,
        boat_type : boat_type,
        boat_material : boat_material,
        price : price,
        unit_price : unit_price,
        vessel_name : vessel_name,
        home_port : home_port,
        location : location,
        published : published
      });
      await boat.save();

      return res.status(200).json({
        success: true,
        message: "Boat save."
      });
    }
  } catch (error) {
    console.error("save-error", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};