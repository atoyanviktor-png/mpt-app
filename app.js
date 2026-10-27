// Переключение вкладок
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// База данных расписания по дням (0 - Воскресенье, 1 - Понедельник и т.д.)
const scheduleData = {
    1: [ // Понедельник
        {num: 1, name: "История", teacher: "Л.В. Бегунова", time: "08:30 - 10:00", break: "Перемена 10 мин"},
        {num: 2, name: "Русский язык", teacher: "Н.Е. Петкова", time: "10:10 - 11:40", break: "Перемена 20 мин"},
        {num: 3, name: "Физика", teacher: "Д.Б. Магомедов", time: "12:00 - 13:30", break: "Перемена 20 мин"},
        {num: 4, name: "Информатика", teacher: "Д.С. Городецкая", time: "13:50 - 15:20", break: null}
    ],
    2: [ // Вторник
        {num: 1, name: "Математика", teacher: "В.В. Положков", time: "08:30 - 10:00", break: "Перемена 10 мин"},
        {num: 2, name: "Физика", teacher: "Д.Б. Магомедов", time: "10:10 - 11:40", break: "Перемена 20 мин"},
        {num: 3, name: "Физическая культура", teacher: "А.А. Пучков", time: "12:00 - 13:30", break: null}
    ],
    3: [ // Среда
        {num: 2, name: "ОБЗР", teacher: "М.А. Кульгавов", time: "10:10 - 11:40", break: "Перемена 20 мин"},
        {num: 3, name: "Обработка цифровой информации", teacher: "Н.А. Кульчинская", time: "12:00 - 13:30", break: "Перемена 20 мин"},
        {num: 4, name: "УП 04 01 Учебная практика", teacher: "Н.А. Кульчинская", time: "13:50 - 15:20", break: "Перемена 10 мин"},
        {num: 5, name: "Информатика", teacher: "Д.С. Городецкая", time: "15:30 - 17:00", break: null}
    ],
    4: [], // Четверг (Выходной)
    5: [ // Пятница
        {num: 2, name: "Литература", teacher: "Н.Е. Петкова", time: "10:10 - 11:40", break: "Перемена 20 мин"},
        {num: 3, name: "Индивидуальный проект / География", teacher: "М.Н. Кирюхина / В.А. Николаев", time: "12:00 - 13:30", break: "Перемена 20 мин"},
        {num: 4, name: "История", teacher: "Л.В. Бегунова", time: "13:50 - 15:20", break: "Перемена 10 мин"},
        {num: 5, name: "Обществознание", teacher: "С.А. Абрамов", time: "15:30 - 17:00", break: null}
    ],
    6: [ // Суббота
        {num: 2, name: "Математика", teacher: "В.В. Положков", time: "10:10 - 11:40", break: "Перемена 20 мин"},
        {num: 3, name: "Иностранный язык", teacher: "Н.Г. Николаева, А.Л. Лосикова", time: "12:00 - 13:30", break: "Перемена 20 мин"},
        {num: 4, name: "Математика", teacher: "В.В. Положков", time: "13:50 - 15:20", break: null}
    ],
    0: [] // Воскресенье (Выходной)
};

const dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

// Функция для отрисовки Обзора на сегодня
function renderOverview() {
    const now = new Date();
    const todayIndex = now.getDay(); // 0-6
    const todayName = dayNames[todayIndex];
    
    // Обновляем дату в шапке
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let dateStr = now.toLocaleDateString('ru-RU', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('current-date').textContent = dateStr;
    
    // Ставим название дня
    document.getElementById('today-name').textContent = todayName;

    // Отрисовываем расписание
    const container = document.getElementById('today-schedule');
    const lessons = scheduleData[todayIndex];

    if (!lessons || lessons.length === 0) {
        container.innerHTML = '<div class="grades-placeholder"><h3>Выходной 🎉</h3><p>Сегодня пар нет, отдыхай!</p></div>';
        return;
    }

    let html = '';
    lessons.forEach(lesson => {
        html += `
            <div class="lesson-card">
                <div class="lesson-num">${lesson.num}</div>
                <div class="lesson-info">
                    <h3>${lesson.name}</h3>
                    <p>${lesson.teacher}</p>
                </div>
                <div class="lesson-time">
                    <span>${lesson.time.split(' - ')[0]}</span>
                    <span class="time-end">${lesson.time.split(' - ')[1]}</span>
                </div>
            </div>
        `;
        if (lesson.break) {
            html += `
                <div class="break-info">
                    <span>${lesson.break}</span>
                </div>
            `;
        }
    });
    container.innerHTML = html;
}

function openGrades() { window.open("https://mpt.rea.ru/student/progress/journal", "_blank"); }
function openClassroom() { window.open("https://classroom.google.com", "_blank"); }

function updateSchedule() {
    const textElement = document.getElementById('update-text');
    textElement.textContent = "Обновление...";
    setTimeout(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        textElement.textContent = `Последнее обновление: Сегодня в ${timeStr}`;
    }, 1500);
}

function contactDev() { alert("Связь с разработчиком: @твой_телеграм"); }

function toggleTheme() {
    const root = document.documentElement;
    const themeText = document.getElementById('theme-text');
    if (root.style.getPropertyValue('--bg-color') === '#f2f2f7' || !root.style.getPropertyValue('--bg-color')) {
        root.style.setProperty('--bg-color', '#000000');
        root.style.setProperty('--card-bg', '#1c1c1e');
        root.style.setProperty('--text-main', '#ffffff');
        root.style.setProperty('--text-secondary', '#8e8e93');
        root.style.setProperty('--accent-color', '#2c2c2e');
        root.style.setProperty('--nav-bg', 'rgba(28, 28, 30, 0.85)');
        themeText.textContent = "Темная";
    } else {
        root.style.setProperty('--bg-color', '#f2f2f7');
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--text-main', '#000000');
        root.style.setProperty('--text-secondary', '#8e8e93');
        root.style.setProperty('--accent-color', '#e5e5ea');
        root.style.setProperty('--nav-bg', 'rgba(249, 249, 249, 0.85)');
        themeText.textContent = "Светлая";
    }
}

// Запускаем всё при загрузке
renderOverview();

// Обновляем каждую минуту на случай, если наступит полночь (чтобы обзор сменился)
setInterval(renderOverview, 60000);