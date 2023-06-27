//Model archive for mongoo
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const boatSchema = new Schema(
  {
    userId: { type: String, unique: false, required: true },
    pic: { type: String, required: false, unique: false },
    make: { type: String, unique: false, required: false },
    model : { type: String, unique: false, required: false },
    length : { type: String, unique: false, required: false },
    unit_lenght : { type: String, unique: false, required: false },
    year : { type: String, unique: false, required: false },
    boat_type : { type: String, unique: false, required: false },
    boat_material : { type: String, unique: false, required: false },
    price : { type: String, unique: false, required: false },
    unit_price : { type: String, unique: false, required: false },
    vessel_name : { type: String, unique: false, required: false },
    home_port : { type: String, unique: false, required: false },
    location : { type: String, unique: false, required: false },
    published : { type: String, unique: false, required: false },
    name : { type: String, unique: false, required: false },
    locationContact : { type: String, unique: false, required: false },
    phone : { type: String, unique: false, required: false }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);
const Boat = mongoose.model("boat", boatSchema);
module.exports = Boat;