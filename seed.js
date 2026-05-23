require('dotenv').config();
const mongoose = require('mongoose');
const WeatherData = require('./models/WeatherData'); 

const data = [
  {"tavg": 22.1, "pres": 1012, "co2": 415, "dust": 12.4, "stationId": "ESP32_01", "date": "2024-05-20T10:00:00.000Z"},
  {"tavg": 22.3, "pres": 1012, "co2": 420, "dust": 10.8, "stationId": "ESP32_01", "date": "2024-05-20T10:05:00.000Z"},
  {"tavg": 22.5, "pres": 1011, "co2": 450, "dust": 15.2, "stationId": "ESP32_01", "date": "2024-05-20T10:10:00.000Z"},
  {"tavg": 22.8, "pres": 1011, "co2": 485, "dust": 18.1, "stationId": "ESP32_01", "date": "2024-05-20T10:15:00.000Z"},
  {"tavg": 23.0, "pres": 1011, "co2": 510, "dust": 22.5, "stationId": "ESP32_01", "date": "2024-05-20T10:20:00.000Z"},
  {"tavg": 23.2, "pres": 1010, "co2": 540, "dust": 25.0, "stationId": "ESP32_01", "date": "2024-05-20T10:25:00.000Z"},
  {"tavg": 23.1, "pres": 1010, "co2": 525, "dust": 20.3, "stationId": "ESP32_01", "date": "2024-05-20T10:30:00.000Z"},
  {"tavg": 22.9, "pres": 1010, "co2": 490, "dust": 16.7, "stationId": "ESP32_01", "date": "2024-05-20T10:35:00.000Z"},
  {"tavg": 22.7, "pres": 1011, "co2": 460, "dust": 14.1, "stationId": "ESP32_01", "date": "2024-05-20T10:40:00.000Z"},
  {"tavg": 22.6, "pres": 1011, "co2": 445, "dust": 11.2, "stationId": "ESP32_01", "date": "2024-05-20T10:45:00.000Z"},
  {"tavg": 22.5, "pres": 1012, "co2": 430, "dust": 9.5, "stationId": "ESP32_01", "date": "2024-05-20T10:50:00.000Z"},
  {"tavg": 22.4, "pres": 1012, "co2": 420, "dust": 8.8, "stationId": "ESP32_01", "date": "2024-05-20T10:55:00.000Z"},
  {"tavg": 22.3, "pres": 1013, "co2": 415, "dust": 10.1, "stationId": "ESP32_01", "date": "2024-05-20T11:00:00.000Z"},
  {"tavg": 22.5, "pres": 1013, "co2": 440, "dust": 13.4, "stationId": "ESP32_01", "date": "2024-05-20T11:05:00.000Z"},
  {"tavg": 22.8, "pres": 1013, "co2": 480, "dust": 19.6, "stationId": "ESP32_01", "date": "2024-05-20T11:10:00.000Z"},
  {"tavg": 23.0, "pres": 1012, "co2": 550, "dust": 28.2, "stationId": "ESP32_01", "date": "2024-05-20T11:15:00.000Z"},
  {"tavg": 23.3, "pres": 1012, "co2": 610, "dust": 32.5, "stationId": "ESP32_01", "date": "2024-05-20T11:20:00.000Z"},
  {"tavg": 23.5, "pres": 1011, "co2": 680, "dust": 35.1, "stationId": "ESP32_01", "date": "2024-05-20T11:25:00.000Z"},
  {"tavg": 23.4, "pres": 1011, "co2": 640, "dust": 29.8, "stationId": "ESP32_01", "date": "2024-05-20T11:30:00.000Z"},
  {"tavg": 23.2, "pres": 1011, "co2": 590, "dust": 24.3, "stationId": "ESP32_01", "date": "2024-05-20T11:35:00.000Z"}
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Підключено до бази для посіву");
    
    await WeatherData.deleteMany({}); 

    await WeatherData.insertMany(data);
    console.log("Дані успішно завантажені в MongoDB!");
    process.exit();
  } catch (err) {
    console.error("Помилка:", err);
    process.exit(1);
  }
}

seedDB();