const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main"
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);