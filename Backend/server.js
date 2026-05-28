const express = require('express');
const cors = require('cors');
const bankRoutes = require('./routes/bankRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so your React frontend can talk to this backend server smoothly
app.use(cors());
// Middleware to automatically parse incoming JSON data payloads
app.use(express.json());

// Wire up our API routing endpoints layer
app.use('/api', bankRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});