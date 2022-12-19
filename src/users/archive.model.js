//Model archive for mongoo
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    archiveId: { type: String, unique: true, required: true },
    userId: { type: String, unique: false, required: true },
    url: { type: String, required: true, unique: false },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);
const Archive = mongoose.model("archive", userSchema);
module.exports = Archive;