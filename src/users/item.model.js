//Model archive for mongoo
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    data: { type: String, unique: false, required: true },
    type: { type: String, required: true, unique: false },
    userId: { type: String, unique: false, required: true },
    id_temp: { type: String, unique: false, required: true }
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);
const Item = mongoose.model("item", itemSchema);
module.exports = Item;