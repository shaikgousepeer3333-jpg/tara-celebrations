const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true
        },

        fullName: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        email: {
            type: String,
            default: ""
        },

        occasion: {
            type: String,
            required: true
        },

        package: {
            type: String,
            required: true
        },

        date: {
            type: String,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        guests: {
            type: String,
            required: true
        },

        notes: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            default: "Pending"
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        collection: "bookings"
    }
);

module.exports = mongoose.model("Booking", bookingSchema);