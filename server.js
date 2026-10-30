const express = require('express');
const https = require('https');
const app = express();

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

function parseSchedule() {
    return new Promise((resolve, reject) => {
        const url = 'https://mpt.ru/raspisanie/';
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const allSchedule = {};
                
                // 1. Находим все группы
                const groupRegex = /<h3[^>]*>(.*?)<\/h3>/gs;
                let groupMatch;
                const groupPositions = [];

                while ((groupMatch = groupRegex.exec(data)) !== null) {
                    let groupName = groupMatch[1].replace(/<[^>]+>/g, '').trim();
                    if (groupName.length < 4 || !groupName.includes('-')) continue;
                    groupPositions.push({ name: groupName, index: groupMatch.index });
                }

                // 2. Для каждой группы ищем дни
                groupPositions.forEach((group, i) => {
                    const nextGroupIndex = i + 1 < groupPositions.length ? groupPositions[i + 1].index : data.length;
                    const groupHtml = data.substring(group.index, nextGroupIndex);
                    const scheduleForGroup = {};

                    // 3. Ищем блоки дней. Они начинаются с <h4>ПОНЕДЕЛЬНИК и т.д.
                    const dayRegex = /<h4[^>]*>(.*?)<\/h4>/gs;
                    let dayMatch;
                    const dayBlocks = [];

                    while ((dayMatch = dayRegex.exec(groupHtml)) !== null) {
                        let dayText = dayMatch[1].toUpperCase();
                        let dayName = '';
                        
                        if (dayText.includes('ПОНЕДЕЛЬНИК')) dayName = 'Понедельник';
                        if (dayText.includes('ВТОРНИК')) dayName = 'Вторник';
                        if (dayText.includes('СРЕДА')) dayName = 'Среда';
                        if (dayText.includes('ЧЕТВЕРГ')) dayName = 'Четверг';
                        if (dayText.includes('ПЯТНИЦА')) dayName = 'Пятница';
                        if (dayText.includes('СУББОТА')) dayName = 'Суббота';

                        if (dayName) {
                            dayBlocks.push({ name: dayName, index: dayMatch.index });
                        }
                    }

                    // 4. Для каждого дня берем таблицу, которая идет после него
                    dayBlocks.forEach((day, j) => {
                        const nextDayIndex = j + 1 < dayBlocks.length ? dayBlocks[j + 1].index : groupHtml.length;
                        const dayHtml = groupHtml.substring(day.index, nextDayIndex);

                        const tableStart = dayHtml.indexOf('<table');
                        if (tableStart === -1) return; // Если таблицы нет, пропускаем

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
