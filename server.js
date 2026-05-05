require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); // 👉 Додали axios для запитів до API
const WeatherData = require('./models/WeatherData');

const app = express();
app.use(express.json());
app.use(cors()); // Дозволяє фронтенду бачити дані

// Підключення до бази
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ База підключена');
        
        // ⚠️ ОЧИЩЕННЯ БАЗИ ВІД ФАЛЬШИВИХ ДАНИХ:
        // Розкоментуй рядок нижче, запустіть сервер ОДИН РАЗ, щоб повністю стерти старі моки.
        // Після очищення бази знову закоментуй цей рядок, щоб реальні дані не видалялися при кожному перезапуску сервера!
        //await WeatherData.deleteMany({}); console.log('🧹 Базу успішно очищено від старих даних!');
    })
    .catch(err => console.log('❌ Помилка БД:', err));

// =================== DATA INGESTION WORKER (ПІДКАЧКА РЕАЛЬНИХ API) ===================

async function fetchAndSaveRealData() {
  try {
    console.log('🔄 [Data Pipeline] Отримання свіжих даних з зовнішніх API...');

    // 1. Отримуємо тиск для Києва (Open-Meteo)
    const resPressure = await axios.get(
      'https://api.open-meteo.com/v1/forecast?latitude=50.45&longitude=30.52&current=surface_pressure'
    );
    const pressure = resPressure.data.current.surface_pressure;

    // 2. Отримуємо пил PM2.5 для Києва (Open-Meteo Air Quality)
    const resAirQuality = await axios.get(
      'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=50.45&longitude=30.52&current=pm2_5'
    );
    const pm25 = resAirQuality.data.current.pm2_5;

    // 3. Віртуальний датчик (Soft Sensor) для CO2
    // База 400 ppm + залежність від пилу (більше пилу = більше CO2) + легкий шум для живої анімації
    const calculatedCO2 = Math.round(400 + (pm25 * 8) + (Math.random() * 30));

    // 4. Записуємо в схему
    const newRecord = new WeatherData({
      co2: calculatedCO2,
      dust: pm25,
      pres: pressure,
      date: new Date()
    });

    await newRecord.save();
    console.log('✅ [Data Pipeline] Новий реальний запис збережено в MongoDB:', {
      co2: calculatedCO2,
      dust: pm25,
      pres: pressure
    });

  } catch (error) {
    console.error('❌ [Data Pipeline] Помилка отримання даних з API:', error.message);
  }
}

// ====================================================================================

// МАРШРУТ 1: Отримання ОДНОГО останнього запису (для карток)
app.get('/api/weather/latest', async (req, res) => {
    try {
        const latest = await WeatherData.findOne().sort({ date: -1 });
        res.json(latest); 
    } catch (err) {
        res.status(500).json({ message: "Помилка бази даних" });
    }
});

// МАРШРУТ 2: Прийом даних (залишаємо на випадок тестування через curl/Postman)
app.post('/api/weather', async (req, res) => {
    try {
        const newData = new WeatherData(req.body);
        await newData.save();
        res.status(201).send('Дані збережено в MongoDB');
        console.log('📊 Отримано дані через POST:', req.body);
    } catch (e) { 
        res.status(400).send(e.message); 
    }
});

// МАРШРУТ 3: Отримання історії з фільтрацією за часовим проміжком
app.get('/api/weather/history', async (req, res) => {
    try {
        const { range } = req.query; // Отримуємо параметр range ('1h', '6h', '24h', '7d')
        let timeLimit = new Date();

        // Обчислюємо початкову точку часу залежно від вибраного діапазону
        if (range === '6h') {
            timeLimit.setHours(timeLimit.getHours() - 6);
        } else if (range === '24h') {
            timeLimit.setHours(timeLimit.getHours() - 24);
        } else if (range === '7d') {
            timeLimit.setDate(timeLimit.getDate() - 7);
        } else {
            // За замовчуванням (або якщо '1h') беремо останню годину
            timeLimit.setHours(timeLimit.getHours() - 1);
        }

        // Шукаємо в базі тільки ті записи, які новіші за наш ліміт часу.
        // Сортуємо від старіших до новіших ({ date: 1 }), щоб графік Recharts малювався зліва направо.
        const history = await WeatherData.find({
            date: { $gte: timeLimit }
        }).sort({ date: 1 });

        res.json(history); 
    } catch (err) {
        console.error("Помилка отримання історії:", err);
        res.status(500).json({ message: "Помилка отримання історії" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);

    // Миттєвий запуск воркера при старті, щоб відразу заповнити першу точку
    fetchAndSaveRealData();

    // Далі запускаємо інтервал регулярного збору даних (наприклад, кожні 10 хвилин)
    const intervalTime = 10 * 60 * 1000; 
    setInterval(fetchAndSaveRealData, intervalTime);
});