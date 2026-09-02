// ==========================================
// TARA CELEBRATIONS BACKEND SERVER
// MongoDB + Express API
// ==========================================

require("dotenv").config({
    path: __dirname + "/.env"
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const Booking = require("./models/Booking");
const Gallery = require("./models/Gallery");

const app = express();

const PORT = process.env.PORT || 5000;


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json({ limit: "10mb" }));


// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
    mongoose
    .connect("mongodb+srv://shaikgousepeer3333_db_user:PartyHub2026Test@partyhub.4rbzwo8.mongodb.net/?appName=PartyHub", {
        serverSelectionTimeoutMS: 10000
    })
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });


// ==========================================
// BOOKING API
// ==========================================


// ------------------------------------------
// CREATE BOOKING
// ------------------------------------------

app.post("/api/bookings", async (req, res) => {
    try {

        const booking = new Booking(req.body);

        await booking.save();

        res.status(201).json({
            success: true,
            message: "Booking saved successfully!",
            booking
        });

    } catch (error) {

        console.error(
            "Booking save failed:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to save booking",
            error: error.message
        });
    }
});


// ------------------------------------------
// GET ALL BOOKINGS
// ------------------------------------------

app.get("/api/bookings", async (req, res) => {
    try {

        const bookings = await Booking
            .find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            bookings
        });

    } catch (error) {

        console.error(
            "Failed to get bookings:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to get bookings",
            error: error.message
        });
    }
});


// ------------------------------------------
// GET ONE BOOKING
// ------------------------------------------

app.get("/api/bookings/:id", async (req, res) => {
    try {

        const booking = await Booking.findOne({
            id: req.params.id
        });

        if (!booking) {

            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.json({
            success: true,
            booking
        });

    } catch (error) {

        console.error(
            "Failed to get booking:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to get booking",
            error: error.message
        });
    }
});


// ------------------------------------------
// UPDATE BOOKING
// Supports:
// PATCH /api/bookings/:id
// PATCH /api/bookings/:id/status
// ------------------------------------------

async function updateBookingStatus(req, res) {

    try {

        const { status } = req.body;

        if (!status) {

            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Completed",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid status. Allowed values: Pending, Confirmed, Completed, Cancelled"
            });
        }

        const booking =
            await Booking.findOneAndUpdate(
                {
                    id: req.params.id
                },
                {
                    status
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!booking) {

            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.json({
            success: true,
            message:
                "Booking status updated successfully",
            booking
        });

    } catch (error) {

        console.error(
            "Booking status update failed:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update booking status",
            error: error.message
        });
    }
}


// Admin JS uses PATCH /api/bookings/:id
app.patch(
    "/api/bookings/:id",
    updateBookingStatus
);


// Also support /status
app.patch(
    "/api/bookings/:id/status",
    updateBookingStatus
);


// ------------------------------------------
// DELETE BOOKING
// ------------------------------------------

app.delete("/api/bookings/:id", async (req, res) => {

    try {

        const booking =
            await Booking.findOneAndDelete({
                id: req.params.id
            });

        if (!booking) {

            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.json({
            success: true,
            message: "Booking deleted successfully"
        });

    } catch (error) {

        console.error(
            "Booking delete failed:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete booking",
            error: error.message
        });
    }
});


// ==========================================
// GALLERY API
// ==========================================


// ------------------------------------------
// GET ALL GALLERY PHOTOS
// ------------------------------------------

app.get("/api/gallery", async (req, res) => {

    try {

        const gallery =
            await Gallery
                .find()
                .sort({ createdAt: -1 });

        res.json({
            success: true,
            gallery
        });

    } catch (error) {

        console.error(
            "Failed to get gallery:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to get gallery",
            error: error.message
        });
    }
});


// ------------------------------------------
// ADD GALLERY PHOTO
// ------------------------------------------

app.post("/api/gallery", async (req, res) => {

    try {

        const {
            id,
            category,
            caption,
            img
        } = req.body;


        if (!id || !category || !img) {

            return res.status(400).json({
                success: false,
                message:
                    "id, category and image are required"
            });
        }


        const photo = new Gallery({

            id,

            category,

            caption:
                caption || "",

            img

        });


        await photo.save();


        res.status(201).json({

            success: true,

            message:
                "Gallery photo added successfully",

            gallery: photo

        });

    } catch (error) {

        console.error(
            "Gallery save failed:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to save gallery photo",

            error:
                error.message

        });
    }
});


// ------------------------------------------
// DELETE GALLERY PHOTO
// ------------------------------------------

app.delete(
    "/api/gallery/:id",
    async (req, res) => {

        try {

            const photo =
                await Gallery.findOneAndDelete({
                    id: req.params.id
                });


            if (!photo) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Gallery photo not found"

                });
            }


            res.json({

                success: true,

                message:
                    "Gallery photo deleted successfully"

            });

        } catch (error) {

            console.error(
                "Gallery delete failed:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete gallery photo",

                error:
                    error.message

            });
        }
    }
);


// ==========================================
// HEALTH / TEST ROUTES
// ==========================================


// ------------------------------------------
// MAIN SERVER TEST
// ------------------------------------------

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "Tara Celebrations Backend is Running!"

    });
});


// ------------------------------------------
// API TEST
// ------------------------------------------

app.get("/api/test", (req, res) => {

    res.json({

        success: true,

        message:
            "Tara Celebrations API is Working!"

    });
});


// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API route not found"

    });
});


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {

    console.error(
        "Server error:",
        error
    );

    res.status(500).json({

        success: false,

        message:
            "Internal server error"

    });
});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `Tara Celebrations backend running on http://localhost:${PORT}`
    );

    console.log(
        `API test: http://localhost:${PORT}/api/test`
    );

});
