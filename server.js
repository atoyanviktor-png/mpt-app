const express = require('express');
const https = require('https');
const app = express();

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

let previousSchedule = null; // Хранилище прошлого расписания

function parseSchedule() {
    return new Promise((resolve, reject) => {
        const url = 'https://mpt.ru/raspisanie/';
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const allSchedule = {};
                
                // 1. Находим все заголовки групп
                const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gs;
                let match;
                const groupPositions = [];

                while ((match = h3Regex.exec(data)) !== null) {
                    let groupName = match[1].replace(/<[^>]+>/g, '').trim();
                    if (groupName.length < 4 || !groupName.includes('-')) continue;
                    groupPositions.push({ name: groupName, index: match.index });
                }

                // 2. Для каждой группы берем весь её блок
                groupPositions.forEach((group, i) => {
                    const nextGroupIndex = i + 1 < groupPositions.length ? groupPositions[i + 1].index : data.length;
                    const groupHtml = data.substring(group.index, nextGroupIndex);
                    const scheduleForGroup = {};

                    // 3. Ищем все дни недели в этом блоке
                    const dayKeywords = [
                        { key: 'ПОНЕДЕЛЬНИК', name: 'Понедельник' },
                        { key: 'ВТОРНИК', name: 'Вторник' },
                        { key: 'СРЕДА', name: 'Среда' },
                        { key: 'ЧЕТВЕРГ', name: 'Четверг' },
                        { key: 'ПЯТНИЦА', name: 'Пятница' },
                        { key: 'СУББОТА', name: 'Суббота' }
                    ];

                    let dayPositions = [];

                    dayKeywords.forEach(dk => {
                        const regex = new RegExp(dk.key, 'gi');
                        let m;
                        while ((m = regex.exec(groupHtml)) !== null) {
                            dayPositions.push({ name: dk.name, index: m.index });
                        }
                    });

                    dayPositions.sort((a, b) => a.index - b.index);

                    // 4. Для каждого дня берем таблицу, которая идет после него
                    dayPositions.forEach((day, j) => {
                        const nextDayIndex = j + 1 < dayPositions.length ? dayPositions[j + 1].index : groupHtml.length;
                        const dayHtml = groupHtml.substring(day.index, nextDayIndex);

                        const tableStart = dayHtml.indexOf('<table');
                        if (tableStart === -1) return;

                        const tableEnd = dayHtml.indexOf('</table>', tableStart);
                        if (tableEnd === -1) return;

                        const tableHtml = dayHtml.substring(tableStart, tableEnd + 8);
                        const rows = tableHtml.split('<tr');

                        rows.forEach(row => {
                            if (row.includes('<td')) {
                                const cells = row.match(/<td[^>]*>(.*?)<\/td>/gs);
                                if (cells && cells.length >= 3) {
                                    const clean = (str) => str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                                    const lessonNum = clean(cells[0]);
                                    const subject = clean(cells[1]);
                                    const teacher = clean(cells[2]);

                                    if (lessonNum && subject && subject.length > 2) {
                                        if (!scheduleForGroup[day.name]) scheduleForGroup[day.name] = [];
                                        const times = {
                                            '1': '08:30 - 10:00', '2': '10:10 - 11:40', '3': '12:00 - 13:30',
                                            '4': '13:50 - 15:20', '5': '15:30 - 17:00', '6': '17:05 - 18:35',
                                            '7': '18:40 - 20:10'
                                        };
                                        scheduleForGroup[day.name].push({
                                            num: lessonNum,
                                            name: subject,
                                            teacher: teacher,
                                            time: times[lessonNum] || '??'
                                        });
                                    }
                                }
                            }
                        });
                    });

                    if (Object.keys(scheduleForGroup).length > 0) {
                        allSchedule[group.name] = scheduleForGroup;
                    }
                });

                // === ЛОГИКА СРАВНЕНИЯ ===
                if (previousSchedule) {
                    for (const groupName in allSchedule) {
                        if (previousSchedule[groupName]) {
                            for (const day in allSchedule[groupName]) {
                                const currentLessons = allSchedule[groupName][day];
                                const prevLessons = previousSchedule[groupName][day] || [];
                                
                                // Проверяем, есть ли отмененные пары (были в прошлом, нет сейчас)
                                prevLessons.forEach(prevLesson => {
                                    const isStillThere = currentLessons.some(curr => 
                                        curr.num === prevLesson.num && 
                                        curr.name === prevLesson.name
                                    );
                                    
                                    if (!isStillThere) {
                                        // Пара отменена, добавляем её в текущее расписание со статусом CANCELLED
                                        currentLessons.push({
                                            ...prevLesson,
                                            status: 'CANCELLED'
                                        });
                                    }
                                });
                            }
                        }
                    }
                }
                // ========================

                previousSchedule = allSchedule; // Сохраняем текущее расписание
                resolve(allSchedule);
            });
        }).on('error', (err) => reject(err));
    });
}

app.get('/api/schedule', async (req, res) => {
    try {
        console.log("Parsing schedule...");
        const schedule = await parseSchedule();
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: "Parsing error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
