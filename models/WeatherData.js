const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    tavg: Number,
    pres: Number,
    co2: Number,
    dust: Number,
    stationId: String
});

module.exports = mongoose.model('Data', weatherDataSchema);