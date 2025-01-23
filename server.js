const express = require('express');
const bodyParser = require('body-parser'); // parsira JSON podatoci
const cors = require('cors'); // pravam povici od isti localhost
const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const orderRoutes = require('./routes/order');

const app = express(); // kreiram express app
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/app/order', orderRoutes)
// Default route
app.get('/', (req, res) => {
    res.send('Unified API is running...');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
