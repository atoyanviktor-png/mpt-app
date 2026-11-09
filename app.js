// Переключение вкладок
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// --- БАЗА ДАННЫХ (РУЧНАЯ, ИЗ PDF) ---
// Мы вручную вписали сюда расписание для СА-1-26
const database = {
    "СА-1-26": {
        "Понедельник": [
            { num: "1", name: "История", teacher: "Л.В. Бегунова", time: "08:30 - 10:00" },
            { num: "2", name: "Русский язык", teacher: "Н.Е. Петкова", time: "10:10 - 11:40" },
            { num: "3", name: "Физика", teacher: "Д.Б. Магомедов", time: "12:00 - 13:30" },
            { num: "4", name: "Информатика", teacher: "Д.С. Городецкая", time: "13:50 - 15:20" }
        ],
        "Вторник": [
            { num: "1", name: "Математика", teacher: "В.В. Положков", time: "08:30 - 10:00" },
            { num: "2", name: "Физика", teacher: "Д.Б. Магомедов", time: "10:10 - 11:40" },
            { num: "3", name: "Физическая культура", teacher: "А.А. Пучков", time: "12:00 - 13:30" }
        ],
        "Среда": [
            { num: "2", name: "Основы безопасности и защиты Родины", teacher: "М.А. Кульгавов", time: "10:10 - 11:40" },
            { num: "3", name: "Обработка цифровой информации", teacher: "Н.А. Кульчинская", time: "12:00 - 13:30" },
            { num: "4", name: "УП 04 01 Учебная практика", teacher: "Н.А. Кульчинская", time: "13:50 - 15:20" },
            { num: "5", name: "Информатика", teacher: "Д.С. Городецкая", time: "15:30 - 17:00" }
        ],
        "Четверг": [],
        "Пятница": [
            { num: "2", name: "Литература", teacher: "Н.Е. Петкова", time: "10:10 - 11:40" },
            { num: "3", name: "Индивидуальный проект / География", teacher: "М.Н. Кирюхина / В.А. Николаев", time: "12:00 - 13:30" },
            { num: "4", name: "История", teacher: "Л.В. Бегунова", time: "13:50 - 15:20" },
            { num: "5", name: "Обществознание", teacher: "С.А. Абрамов", time: "15:30 - 17:00" }
        ],
        "Суббота": [
            { num: "2", name: "Математика", teacher: "В.В. Положков", time: "10:10 - 11:40" },
            { num: "3", name: "Иностранный язык", teacher: "Н.Г. Николаева, А.Л. Лосикова", time: "12:00 - 13:30" },
            { num: "4", name: "Математика", teacher: "В.В. Положков", time: "13:50 - 15:20" }
        ]
    }
};

const specialtiesMap = {
    "09.02.06 СА": ["СА-1-26"],
};

const dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

function openSpecialties() { 
    const modal = document.getElementById('specialty-modal');
    const list = document.getElementById('specialty-list');
    list.innerHTML = ''; 
    Object.keys(specialtiesMap).forEach(spec => {
        const div = document.createElement('div');
        div.textContent = spec;
        div.onclick = () => selectSpecialty(spec);
        list.appendChild(div);
    });
    modal.classList.add('active'); 
}

function selectSpecialty(spec) {
    document.getElementById('specialty-modal').classList.remove('active');
    const groupList = document.getElementById('group-list');
    groupList.innerHTML = '';
    const groups = specialtiesMap[spec] || [];
    groups.forEach(group => {
        const div = document.createElement('div');
        div.textContent = group;
        div.onclick = () => selectGroup(group);
        groupList.appendChild(div);
    });
    document.getElementById('group-modal').classList.add('active');
}

function selectGroup(group) {
    document.getElementById('group-modal').classList.remove('active');
    document.getElementById('selected-group-text').textContent = group;
    localStorage.setItem('userGroup', group);
}

function saveGroupAndStart() {
    const selectedGroup = localStorage.getItem('userGroup');
    if (!selectedGroup) { alert("Выберите группу!"); return; }
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('header-group-name').textContent = selectedGroup;
    document.getElementById('current-group-settings').textContent = selectedGroup;
    renderApp();
}

function renderApp() {
    const group = localStorage.getItem('userGroup');
    const now = new Date();
    const todayIndex = now.getDay();
    const todayName = dayNames[todayIndex];
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let dateStr = now.toLocaleDateString('ru-RU', options);
    document.getElementById('current-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('today-name').textContent = todayName;

    // Рендер "Обзор" (на сегодня)
    const scheduleForToday = (database[group] && database[group][todayName]) || [];
    const overviewContainer = document.getElementById('today-schedule');
    if (scheduleForToday.length === 0) {
        overviewContainer.innerHTML = '<div class="grades-placeholder"><h3>Пар нет 😴</h3><p>Сегодня выходной.</p></div>';
    } else {
        let html = '';
        scheduleForToday.forEach(l => {
            html += `<div class="lesson-card"><div class="lesson-num">${l.num}</div><div class="lesson-info"><h3>${l.name}</h3><p>${l.teacher}</p></div><div class="lesson-time"><span>${l.time.split(' - ')[0]}</span><span class="time-end">${l.time.split(' - ')[1]}</span></div></div>`;
        });
        overviewContainer.innerHTML = html;
    }

    // Рендер "Неделя" (теперь красиво, как звонки)
    const weekContainer = document.getElementById('full-week-schedule');
    let weekHtml = '';
    for (let i = 1; i <= 6; i++) {
        const dayName = dayNames[i];
        weekHtml += `<div class="day-title"><h2>${dayName}</h2><span class="badge">${group}</span></div>`;
        const daySchedule = (database[group] && database[group][dayName]) || [];
        if (daySchedule.length === 0) {
            weekHtml += `<p style="color: var(--text-secondary); margin-bottom: 15px; padding-left: 10px;">Выходной</p>`;
        } else {
            daySchedule.forEach(l => {
                weekHtml += `<div class="lesson-card"><div class="lesson-num">${l.num}</div><div class="lesson-info"><h3>${l.name}</h3><p>${l.teacher}</p></div><div class="lesson-time"><span>${l.time.split(' - ')[0]}</span><span class="time-end">${l.time.split(' - ')[1]}</span></div></div>`;
            });
        }
    }
    weekContainer.innerHTML = weekHtml;
}

function changeGroup() {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('onboarding-screen').style.display = 'flex';
}

window.onload = function() {
    const savedGroup = localStorage.getItem('userGroup');
    if (savedGroup) {
        document.getElementById('onboarding-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        document.getElementById('header-group-name').textContent = savedGroup;
        document.getElementById('current-group-settings').textContent = savedGroup;
        renderApp();
    }
};

function openGrades() { window.open("https://mpt.rea.ru/student/progress/journal", "_blank"); }
function openClassroom() { window.open("https://classroom.google.com", "_blank"); }
