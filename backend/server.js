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

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Booking = require("./models/Booking");
const Gallery = require("./models/Gallery");
const SiteContent = require("./models/SiteContent");
const User = require("./models/User");
const siteContentDefaults = require("./siteContentDefaults");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;


// ==========================================
// CHECK ENVIRONMENT
// ==========================================

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing from .env");
    process.exit(1);
}

if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET is missing from .env");
    process.exit(1);
}


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json({
    limit: "10mb"
}));


// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
    .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000
    })
    .then(() => {

        console.log("");
        console.log("==========================================");
        console.log("MongoDB connected successfully!");
        console.log(
            "MongoDB host:",
            mongoose.connection.host
        );
        console.log(
            "MongoDB database:",
            mongoose.connection.name
        );
        console.log("==========================================");
        console.log("");

    })
    .catch((error) => {

        console.error("");
        console.error("==========================================");
        console.error("MongoDB connection failed!");
        console.error(error.message);
        console.error("==========================================");
        console.error("");

    });


// ==========================================
// MONGODB CONNECTION EVENTS
// ==========================================

mongoose.connection.on("error", (error) => {

    console.error(
        "MongoDB error:",
        error.message
    );

});

mongoose.connection.on("disconnected", () => {

    console.log("MongoDB disconnected");

});


// ==========================================
// AUTH API (for the mobile app only)
// ==========================================

function signToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" }
    );
}

function toPublicUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email
    };
}

async function requireAuth(req, res, next) {

    try {

        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }

        req.user = user;
        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }

}


// ------------------------------------------
// SIGN UP
// ------------------------------------------

app.post("/api/auth/signup", async (req, res) => {

    try {

        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const existing = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        await user.save();

        console.log("✅ New account created:", user.email);

        const token = signToken(user);

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: toPublicUser(user)
        });

    } catch (error) {

        console.error("❌ Signup failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create account",
            error: error.message
        });

    }

});


// ------------------------------------------
// LOGIN
// ------------------------------------------

app.post("/api/auth/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = signToken(user);

        console.log("✅ User logged in:", user.email);

        res.json({
            success: true,
            message: "Logged in successfully",
            token,
            user: toPublicUser(user)
        });

    } catch (error) {

        console.error("❌ Login failed:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to log in",
            error: error.message
        });

    }

});


// ------------------------------------------
// GET CURRENT USER (used by the app to check
// if a saved login is still valid)
// ------------------------------------------

app.get("/api/auth/me", requireAuth, async (req, res) => {

    res.json({
        success: true,
        user: toPublicUser(req.user)
    });

});


// ==========================================
// BOOKING API
// ==========================================


// ------------------------------------------
// CREATE BOOKING
// ------------------------------------------

app.post("/api/bookings", async (req, res) => {

    try {

        console.log("");
        console.log("Creating booking...");
        console.log("Booking data:", req.body);

        const booking = new Booking(req.body);

        await booking.save();

        console.log(
            "✅ Booking saved:",
            booking.id
        );

        res.status(201).json({

            success: true,

            message:
                "Booking saved successfully!",

            booking

        });

    } catch (error) {

        console.error(
            "❌ Booking save failed:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to save booking",

            error:
                error.message

        });

    }

});


// ------------------------------------------
// GET ALL BOOKINGS
// ------------------------------------------

app.get("/api/bookings", async (req, res) => {

    try {

        const bookings =
            await Booking
                .find()
                .sort({
                    createdAt: -1
                });

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

            message:
                "Failed to get bookings",

            error:
                error.message

        });

    }

});


// ------------------------------------------
// GET ONE BOOKING
// ------------------------------------------

app.get("/api/bookings/:id", async (req, res) => {

    try {

        const booking =
            await Booking.findOne({

                id: req.params.id

            });

        if (!booking) {

            return res.status(404).json({

                success: false,

                message:
                    "Booking not found"

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

            message:
                "Failed to get booking",

            error:
                error.message

        });

    }

});


// ------------------------------------------
// UPDATE BOOKING STATUS
// ------------------------------------------

async function updateBookingStatus(req, res) {

    try {

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Completed",
            "Cancelled"
        ];

        const allowedFields = [
            "fullName", "phone", "email", "occasion", "package",
            "date", "time", "guests", "notes", "status"
        ];

        const update = {};
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                update[field] = req.body[field];
            }
        }

        if (update.status && !allowedStatuses.includes(update.status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Allowed values: Pending, Confirmed, Completed, Cancelled"
            });
        }

        if (!Object.keys(update).length) {
            return res.status(400).json({
                success: false,
                message: "At least one booking field is required"
            });
        }

        const booking = await Booking.findOneAndUpdate(
            { id: req.params.id },
            update,
            { new: true, runValidators: true }
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        res.json({
            success: true,
            message: "Booking updated successfully",
            booking
        });

    } catch (error) {

        console.error(
            "Booking update failed:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to update booking",
            error: error.message
        });

    }

}

// ------------------------------------------
// PATCH BOOKING
// ------------------------------------------

app.patch(
    "/api/bookings/:id",
    updateBookingStatus
);


// ------------------------------------------
// PATCH BOOKING STATUS
// ------------------------------------------

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

                message:
                    "Booking not found"

            });

        }

        console.log(
            "Booking deleted:",
            req.params.id
        );

        res.json({

            success: true,

            message:
                "Booking deleted successfully"

        });

    } catch (error) {

        console.error(
            "Booking delete failed:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to delete booking",

            error:
                error.message

        });

    }

});


// ==========================================
// WEBSITE CONTENT API
// ==========================================

app.get("/api/site-content", async (req, res) => {
    try {
        const saved = await SiteContent.findOne({ key: "main" }).lean();
        res.json({
            success: true,
            content: {
                ...siteContentDefaults,
                ...(saved?.data || {})
            }
        });
    } catch (error) {
        console.error("Failed to get site content:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to get website content",
            error: error.message
        });
    }
});

app.put("/api/site-content", async (req, res) => {
    try {
        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({ success: false, message: "Website content must be an object" });
        }

        const content = { ...siteContentDefaults, ...req.body };
        const saved = await SiteContent.findOneAndUpdate(
            { key: "main" },
            { key: "main", data: content },
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );

        res.json({
            success: true,
            message: "Website content saved successfully",
            content: saved.data
        });
    } catch (error) {
        console.error("Website content save failed:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to save website content",
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
                .sort({
                    createdAt: -1
                });

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

            message:
                "Failed to get gallery",

            error:
                error.message

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

        console.log(
            "Gallery photo saved:",
            id
        );

        res.status(201).json({

            success: true,

            message:
                "Gallery photo added successfully",

            gallery:
                photo

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
// DATABASE TEST
// ==========================================

app.get("/api/db-test", async (req, res) => {

    try {

        // Make sure MongoDB is actually connected
        if (mongoose.connection.readyState !== 1) {

            return res.status(503).json({

                success: false,

                mongodb:
                    "not connected",

                database:
                    mongoose.connection.name || null

            });

        }

        const bookingCount =
            await Booking.countDocuments();

        const galleryCount =
            await Gallery.countDocuments();

        res.json({

            success: true,

            mongodb:
                "connected",

            database:
                mongoose.connection.name,

            mongodbHost:
                mongoose.connection.host,

            bookingsCollection:
                Booking.collection.name,

            galleryCollection:
                Gallery.collection.name,

            bookingCount:
                bookingCount,

            galleryCount:
                galleryCount

        });

    } catch (error) {

        console.error(
            "Database test failed:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Database test failed",

            error:
                error.message

        });

    }

});


// ==========================================
// BOOKING SPECIFIC DATABASE TEST
// ==========================================

app.get(
    "/api/db-test/booking/:id",
    async (req, res) => {

        try {

            const booking =
                await Booking.findOne({

                    id: req.params.id

                });

            res.json({

                success: true,

                database:
                    mongoose.connection.name,

                collection:
                    Booking.collection.name,

                bookingFound:
                    !!booking,

                booking:
                    booking || null

            });

        } catch (error) {

            console.error(
                "Booking database test failed:",
                error.message
            );

            res.status(500).json({

                success: false,

                message:
                    "Booking database test failed",

                error:
                    error.message

            });

        }

    }
);


// ==========================================
// MAIN SERVER TEST
// ==========================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "Tara Celebrations Backend is Running!"

    });

});


// ==========================================
// API TEST
// ==========================================

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
            "API route not found",

        path:
            req.originalUrl

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

    console.log("");
    console.log("==========================================");
    console.log(
        `Tara Celebrations backend running on port ${PORT}`
    );
    console.log(
        `API test: http://localhost:${PORT}/api/test`
    );
    console.log(
        `Database test: http://localhost:${PORT}/api/db-test`
    );
    console.log(
        `Booking test: http://localhost:${PORT}/api/db-test/booking/TC-906352`
    );
    console.log("==========================================");
    console.log("");

});