const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); // Load .env variables
const path = require('path');
const favoritesRouter = require('./routes/favorites');
const supportTicketRoutes = require('./routes/supportTicket'); // Adjust path as needed
// Import routes
const listingsRouter = require('./routes/listings');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const wantedListingRoutes = require('./routes/wantedListings');
const upload = require('./multerConfig');
// After other middleware and before error handling
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*', // Or '*' to allow all origins (not recommended for production)
  credentials: true
}));
app.use('/api/support', supportTicketRoutes); // Support tickets routes
app.use('/uploads', express.static('uploads'));

app.use('/api/favorites', favoritesRouter);
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/listings', listingsRouter);  // Fix: Use the correct import for listings
app.use('/api/messages', messageRoutes);
// After other middleware and before error handling
app.use('/api/wanted-listings', wantedListingRoutes);
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
