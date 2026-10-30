const express = require('express');
const https = require('https');
const app = express();

const PORT = process.env.PORT || 3000;

// Разрешаем запросы с любого сайта (чтобы наше приложение могло брать данные)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Функция парсинга (наш старый код)
function parseSchedule() {
    return new Promise((resolve, reject) => {
        const url = 'https://mpt.ru/raspisanie/';
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gs;
                let match;
                const allSchedule = {};

                while ((match = h3Regex.exec(data)) !== null) {
                    let groupName = match[1].replace(/<[^>]+>/g, '').trim();
                    if (groupName.length < 4 || !groupName.includes('-')) continue;

                    const afterHeaderIndex = match.index;
                    const tableStart = data.indexOf('<table', afterHeaderIndex);
                    const tableEnd = data.indexOf('</table>', tableStart);
                    if (tableStart === -1 || tableEnd === -1) continue;
                    
                    const tableHtml = data.substring(tableStart, tableEnd + 8);
                    const rows = tableHtml.split('<tr');
                    let currentDay = '';
                    const scheduleForGroup = {};

                    rows.forEach(row => {
                        if (row.includes('ПОНЕДЕЛЬНИК')) currentDay = 'Понедельник';
                        if (row.includes('ВТОРНИК')) currentDay = 'Вторник';
                        if (row.includes('СРЕДА')) currentDay = 'Среда';
                        if (row.includes('ЧЕТВЕРГ')) currentDay = 'Четверг';
                        if (row.includes('ПЯТНИЦА')) currentDay = 'Пятница';
                        if (row.includes('СУББОТА')) currentDay = 'Суббота';

                        if (row.includes('<td')) {
                            const cells = row.match(/<td[^>]*>(.*?)<\/td>/gs);
                            if (cells && cells.length >= 3) {
                                const clean = (str) => str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                                const lessonNum = clean(cells[0]);
                                const subject = clean(cells[1]);
                                const teacher = clean(cells[2]);

                                if (lessonNum && subject && subject.length > 2) {
                                    if (!scheduleForGroup[currentDay]) scheduleForGroup[currentDay] = [];
                                    const times = {
                                        '1': '08:30 - 10:00', '2': '10:10 - 11:40', '3': '12:00 - 13:30',
                                        '4': '13:50 - 15:20', '5': '15:30 - 17:00', '6': '17:05 - 18:35',
                                        '7': '18:40 - 20:10'
                                    };
                                    scheduleForGroup[currentDay].push({
                                        num: lessonNum,
                                        name: subject,
                                        teacher: teacher,
                                        time: times[lessonNum] || '??'
                                    });
                                }
                            }
                        }
                    });

                    if (Object.keys(scheduleForGroup).length > 0) {
                        allSchedule[groupName] = scheduleForGroup;
                    }
                }
                resolve(allSchedule);
            });
        }).on('error', (err) => reject(err));
    });
}

// Главный маршрут, который отдает расписание
app.get('/api/schedule', async (req, res) => {
    try {
        console.log("Кто-то запросил расписание. Парсим...");
        const schedule = await parseSchedule();
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: "Ошибка парсинга" });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
