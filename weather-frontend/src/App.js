import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Імпортуємо компоненти для декомпонованих графіків
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// =================== ДОПОМІЖНІ АНАЛІЗАТОРИ СТАТУСІВ ===================

const getCO2Status = (value) => {
  if (!value) return { color: '#95a5a6', desc: 'Немає даних' };
  if (value < 800) {
    return { color: '#2ecc71', desc: 'Статус: Чудово' }; // Зелений
  } else if (value <= 1200) {
    return { color: '#f1c40f', desc: 'Статус: Посередньо' }; // Жовтий
  } else {
    return { color: '#e74c3c', desc: 'Статус: Небезпека' }; // Червоний
  }
};

const getDustStatus = (value) => {
  if (!value) return { color: '#95a5a6', desc: 'Немає даних' };
  if (value < 12) {
    return { color: '#3498db', desc: 'Статус: Чисте повітря' }; // Блакитний
  } else if (value <= 35.4) {
    return { color: '#f1c40f', desc: 'Статус: Помірний пил' }; // Жовтий
  } else {
    return { color: '#e74c3c', desc: 'Статус: Шкідливий рівень!' }; // Червоний
  }
};

const getPresStatus = (value) => {
  if (!value) return { color: '#95a5a6', desc: 'Немає даних' };
  if (value < 1008) {
    return { color: '#9b59b6', desc: 'Статус: Низький тиск' }; // Фіолетовий
  } else if (value <= 1018) {
    return { color: '#2ecc71', desc: 'Статус: Нормальний тиск' }; // Зелений
  } else {
    return { color: '#e67e22', desc: 'Статус: Високий тиск' }; // Помаранчевий
  }
};

// =====================================================================

function App() {
  const [weather, setWeather] = useState(null);
  const [history, setHistory] = useState([]); // Стан для історії
  const [loading, setLoading] = useState(true);
  
  // Стан для активного часового проміжку (за замовчуванням '1h')
  const [timeRange, setTimeRange] = useState('1h');

  // 👉 1. Визначаємо поточний хост динамічно (localhost для ПК, або IP комп'ютера для телефона)
  const API_BASE = `https://diploma-kalinina-bip-1-22.onrender.com`;

  // 👉 2. Додаємо стейт та ресайз-слухач для адаптивності під мобільні екрани
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Оновлена функція тепер приймає поточний діапазон як параметр та використовує API_BASE
  const loadWeatherData = async (range) => {
    try {
      // Отримуємо останні дані та історію з query-параметром range
      const [resLatest, resHistory] = await Promise.all([
        axios.get(`${API_BASE}/api/weather/latest`),
        axios.get(`${API_BASE}/api/weather/history?range=${range}`) // 👉 Передаємо range на бекенд
      ]);
      
      setWeather(resLatest.data);
      setHistory(resHistory.data);
      loading && setLoading(false);
    } catch (err) {
      console.error("Помилка: сервер не відповідає.");
    }
  };

  // Функція для експорту поточної історії в CSV
  const exportToCSV = () => {
    if (!history || history.length === 0) {
      alert("Немає даних для завантаження!");
      return;
    }

    // Заголовки колонок у файлі
    const headers = ["Дата та Час", "Рівень CO2 (ppm)", "Концентрація пилу (мкг/м³)", "Атмосферний тиск (hPa)"];

    // Перетворюємо кожен запис з історії у рядок CSV
    const csvRows = [
      headers.join(';'), // Перший рядок — заголовки (розділювач крапка з комою для кращої сумісності з Excel)
      ...history.map(item => {
        const formattedDate = new Date(item.date).toLocaleString().replace(/,/g, ''); // Прибираємо зайві коми з дати
        return [
          formattedDate,
          item.co2 || 0,
          item.dust || 0,
          item.pres || 0
        ].join(';');
      })
    ];

    // Додаємо BOM (Byte Order Mark) для коректного кодування кирилиці в Excel (UTF-8)
    const csvContent = "\uFEFF" + csvRows.join('\n');
    
    // Створюємо blob та посилання для скачування
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // Файл називатиметься відповідно до вибраного часового фільтру, наприклад: weather_report_6h.csv
    link.setAttribute("download", `weather_report_${timeRange}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Перезапускаємо інтервал щоразу, коли користувач вибирає інший час
  useEffect(() => {
    loadWeatherData(timeRange); // Миттєвий виклик при зміні кнопки

    const interval = setInterval(() => {
    loadWeatherData(timeRange);
  }, 5000); // Оновлення кожні 5 секунд

  return () => clearInterval(interval); // Чистимо інтервал при зміні dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]); // 👉 Додали [timeRange] в залежності!

  // Розраховуємо динамічні статуси перед рендером
  const co2Status = getCO2Status(weather?.co2);
  const dustStatus = getDustStatus(weather?.dust);
  const presStatus = getPresStatus(weather?.pres);

  return (
    <div style={{ ...styles.container, padding: isMobile ? '20px' : '40px' }}>
      <header style={styles.header}>
        <h1 style={{ fontSize: isMobile ? '22px' : '32px' }}>Система моніторингу повітря в реальному часі</h1>
      </header>

      {loading ? (
        <div style={styles.loader}>Завантаження даних із бази MongoDB...</div>
      ) : (
        <>
          <div style={styles.grid}>
            <MetricCard 
              title={<span>Рівень CO<sub>2</sub></span>}
              value={weather?.co2 || 0} 
              unit="ppm" 
              color={co2Status.color}
              desc={co2Status.desc}  
            />
            <MetricCard 
              title="Концентрація пилу" 
              value={weather?.dust || 0} 
              unit="мкг/м³" 
              color={dustStatus.color} 
              desc={dustStatus.desc}   
            />
            <MetricCard 
              title="Атмосферний тиск" 
              value={weather?.pres || 0} 
              unit="hPa" 
              color={presStatus.color}
              desc={presStatus.desc}  
            />
          </div>

          {/* ТРИКОЛОНКОВИЙ МАКЕТ ДАШБОРДУ З ДИНАМІЧНОЮ АДАПТИВНІСТЮ */}
          <div style={{ 
            ...styles.dashboardLayout, 
            flexDirection: isMobile ? 'column' : 'row', // Стовпчиком на мобілках, рядком на десктопі
            alignItems: isMobile ? 'center' : 'stretch' 
          }}>
            
            {/* ЛІВА КОЛОНКА: СЕЛЕКТОР ЧАСУ */}
            <div style={{ ...styles.sidebar, width: isMobile ? '100%' : '240px', maxWidth: isMobile ? '600px' : 'none' }}>
              <h3 style={styles.sidebarTitle}>Переглянути за:</h3>
              <div style={styles.timeButtonsGrid}>
                <button 
                  style={{ ...styles.timeButton, ...(timeRange === '1h' ? styles.timeButtonActive : {}) }}
                  onClick={() => setTimeRange('1h')}
                >
                  Остання година
                </button>
                <button 
                  style={{ ...styles.timeButton, ...(timeRange === '6h' ? styles.timeButtonActive : {}) }}
                  onClick={() => setTimeRange('6h')}
                >
                  6 годин
                </button>
                <button 
                  style={{ ...styles.timeButton, ...(timeRange === '24h' ? styles.timeButtonActive : {}) }}
                  onClick={() => setTimeRange('24h')}
                >
                  24 години
                </button>
                <button 
                  style={{ ...styles.timeButton, ...(timeRange === '7d' ? styles.timeButtonActive : {}) }}
                  onClick={() => setTimeRange('7d')}
                >
                  Тиждень
                </button>
              </div>
              <button style={styles.exportButton} onClick={exportToCSV}>
                Завантажити звіт (CSV) 💾
              </button>
            </div>

            {/* ЦЕНТРАЛЬНА КОЛОНКА: ГРАФІКИ */}
            <div style={{ ...styles.chartContainer, width: isMobile ? '100%' : '630px', maxWidth: isMobile ? '600px' : 'none' }}>
              <div style={styles.chartsColumn}>
                {/* ГРАФІК 1: ГАЗИ (CO2) */}
                {renderSingleDecomposedChart(<span>Графік газів (CO<sub>2</sub>)</span>, "co2", "ppm", "#2ecc71", history, [400, 'auto'])}
                
                {/* ГРАФІК 2: ПИЛ (PM2.5) */}
                {renderSingleDecomposedChart("Графік пилу (мкг/м³)", "dust", "мкг/м³", "#3498db", history, [5, 'auto'])}
                
                {/* ГРАФІК 3: ТИСК (hPa) */}
                {renderSingleDecomposedChart("Gradik тиску (hPa)", "pres", "hPa", "#e74c3c", history, [1000, 'auto'])}
              </div>
            </div>

            {/* ПРАВА КОЛОНКА: ГЕО-ОГЛЯД З ІНТЕРАКТИВНОЮ Google Map */}
            <div style={{ ...styles.sidebar, width: isMobile ? '100%' : '240px', maxWidth: isMobile ? '600px' : 'none' }}>
              <h3 style={styles.sidebarTitle}>Карта місцеположення</h3>
              
              <div style={{ ...styles.card, borderTop: '6px solid #bdc3c7', display: 'flex', flexDirection: 'column', width: 'auto', padding: '15px', flex: 1 }}>
                {/* Вбудована інтерактивна Google карта Києва */}
                <div style={{ ...styles.mapContainer, minHeight: isMobile ? '250px' : '200px' }}>
                  <iframe
                    title="Kyiv Google Map"
                    src="https://maps.google.com/maps?q=Kyiv&t=&z=10&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0, borderRadius: '8px' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      <footer style={styles.footer}>
        Останнє оновлення: {weather ? new Date(weather.date).toLocaleString() : '---'}
      </footer>
    </div>
  );
}

// Функція-помічник для рендерингу одного окремого графіка
const renderSingleDecomposedChart = (title, dataKey, unit, color, data, domain) => (
  <div style={styles.singleChartContainer}>
    <h4 style={styles.singleChartTitle}>{title}</h4>
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis 
          dataKey="date" 
          stroke="#95a5a6" 
          tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
          fontSize={10}
          allowDuplicatedCategory={false}
        />
        <YAxis stroke="#95a5a6" fontSize={10} domain={domain} label={{ value: unit, angle: -90, position: 'insideLeft', offset: 10, fill: '#95a5a6', fontSize: 10 }}/>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
          labelFormatter={(label) => new Date(label).toLocaleString()}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const MetricCard = ({ title, value, unit, color, desc }) => (
  <div style={{ ...styles.card, borderTop: `6px solid ${color}`, minWidth: '160px', flex: '1 1 auto' }}>
    <h3 style={styles.cardTitle}>{title}</h3>
    <div style={{ ...styles.cardValue, color: color }}>
      {value} <span style={styles.unit}>{unit}</span>
    </div>
    <small style={styles.cardDesc}>{desc}</small>
  </div>
);

const styles = {
  container: { backgroundColor: '#0F172A', minHeight: '100vh', fontFamily: 'Arial, sans-serif', transition: 'padding 0.2s' },
  header: { marginBottom: '40px', textAlign: 'center', color: '#d0f2e0' },
  grid: { display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' },
  card: { backgroundColor: '#1E293B', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', textAlign: 'left' },
  
  dashboardLayout: { 
    display: 'flex', 
    justifyContent: 'center',
    gap: '20px', 
    maxWidth: '1200px', 
    marginLeft: 'auto', 
    marginRight: 'auto',
    marginTop: '30px'
  },

  sidebar: { 
    backgroundColor: '#1E293B', 
    padding: '25px', 
    borderRadius: '12px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxSizing: 'border-box'
  },
  sidebarTitle: { color: '#ade7dd', margin: '0 0 10px 0', fontSize: '16px', textAlign: 'center', fontWeight: 'bold' },
  timeButtonsGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  
  timeButton: { 
    backgroundColor: '#1E293B', 
    color: '#bdc3c7', 
    border: '1px solid #334155', 
    padding: '12px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '14px', 
    transition: 'all 0.2s',
    textAlign: 'center'
  },
  timeButtonActive: { 
    backgroundColor: '#334155', 
    color: '#fff', 
    borderColor: '#475569',
    fontWeight: 'bold'
  },
  exportButton: { 
    backgroundColor: '#1E293B', 
    color: '#fff', 
    border: '1px solid #334155', 
    padding: '12px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '12px', 
    textAlign: 'center',
    marginTop: 'auto', 
    transition: 'all 0.2s'
  },

  chartContainer: { 
    backgroundColor: '#1E293B', 
    padding: '10px', 
    borderRadius: '12px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    boxSizing: 'border-box'
  },
  chartsColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
  
  singleChartContainer: { paddingBottom: '15px' },
  singleChartTitle: { color: '#95a5a6', margin: '0 0 0 0', fontSize: '14px', fontWeight: 'normal', textAlign: 'center' },

  cardTitle: { color: '#ade7dd', margin: '0 0 0 0', fontSize: '16px' },
  cardValue: { fontSize: '32px', fontWeight: 'bold' },
  unit: { fontSize: '18px', fontWeight: 'normal', color: '#95a5a6' },
  cardDesc: { display: 'block', marginTop: '10px', color: '#bdc3c7', fontStyle: 'italic' },
  loader: { fontSize: '20px', color: '#7f8c8d', textAlign: 'center', marginTop: '50px' },
  footer: { marginTop: '40px', textAlign: 'center', color: '#b3edd0', fontSize: '14px' },
  
  mapContainer: {
    borderRadius: '8px',
    flex: 1, 
    overflow: 'hidden', 
    border: '1px solid #334155'
  },
  locationButtonsGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '10px',
    width: '100%'
  }
};

export default App;