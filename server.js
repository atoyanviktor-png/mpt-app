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
                    
                    // Разбиваем таблицу на блоки по дням
                    // Дни недели находятся вне <tr>, но внутри таблицы
                    const dayRegex = /(ПОНЕДЕЛЬНИК|ВТОРНИК|СРЕДА|ЧЕТВЕРГ|ПЯТНИЦА|СУББОТА)/gi;
                    let dayMatch;
                    let lastIndex = 0;
                    const blocks = [];

                    // Ищем все заголовки дней и разбиваем HTML на куски
                    while ((dayMatch = dayRegex.exec(tableHtml)) !== null) {
                        if (lastIndex > 0) {
                            blocks.push({
                                day: tableHtml.substring(lastIndex, dayMatch.index).match(/ПОНЕДЕЛЬНИК|ВТОРНИК|СРЕДА|ЧЕТВЕРГ|ПЯТНИЦА|СУББОТА/i)[0].toUpperCase(),
                                html: tableHtml.substring(lastIndex, dayMatch.index)
                            });
                        }
                        lastIndex = dayMatch.index;
                    }
                    // Добавляем последний блок
                    if (lastIndex > 0) {
                        const remainingHtml = tableHtml.substring(lastIndex);
                        const dayNameMatch = remainingHtml.match(/ПОНЕДЕЛЬНИК|ВТОРНИК|СРЕДА|ЧЕТВЕРГ|ПЯТНИЦА|СУББОТА/i);
                        if (dayNameMatch) {
                            blocks.push({
                                day: dayNameMatch[0].toUpperCase(),
                                html: remainingHtml
                            });
                        }
                    }

                    const scheduleForGroup = {};

                    blocks.forEach(block => {
                        let dayName = '';
                        if (block.day.includes('ПОНЕДЕЛЬНИК')) dayName = 'Понедельник';
                        if (block.day.includes('ВТОРНИК')) dayName = 'Вторник';
                        if (block.day.includes('СРЕДА')) dayName = 'Среда';
                        if (block.day.includes('ЧЕТВЕРГ')) dayName = 'Четверг';
                        if (block.day.includes('ПЯТНИЦА')) dayName = 'Пятница';
                        if (block.day.includes('СУББОТА')) dayName = 'Суббота';

                        const rows = block.html.split('<tr');
                        rows.forEach(row => {
                            if (row.includes('<td')) {
                                const cells = row.match(/<td[^>]*>(.*?)<\/td>/gs);
                                if (cells && cells.length >= 3) {
                                    const clean = (str) => str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                                    const lessonNum = clean(cells[0]);
                                    const subject = clean(cells[1]);
                                    const teacher = clean(cells[2]);

                                    if (lessonNum && subject && subject.length > 2) {
                                        if (!scheduleForGroup[dayName]) scheduleForGroup[dayName] = [];
                                        const times = {
                                            '1': '08:30 - 10:00', '2': '10:10 - 11:40', '3': '12:00 - 13:30',
                                            '4': '13:50 - 15:20', '5': '15:30 - 17:00', '6': '17:05 - 18:35',
                                            '7': '18:40 - 20:10'
                                        };
                                        scheduleForGroup[dayName].push({
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
                        allSchedule[groupName] = scheduleForGroup;
                    }
                }
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
