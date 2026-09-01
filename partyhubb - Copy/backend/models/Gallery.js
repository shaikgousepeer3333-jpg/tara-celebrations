const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true
        },

        category: {
            type: String,
            required: true
        },

        caption: {
            type: String,
            default: ""
        },

        img: {
            type: String,
            required: true
        }
    },
    {
        collection: "gallery",
        timestamps: true
    }
);

module.exports = mongoose.model("Gallery", gallerySchema);