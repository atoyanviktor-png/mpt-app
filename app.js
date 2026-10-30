// Переключение вкладок
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// --- БАЗА ДАННЫХ ---
let database = {}; 

fetch('all_schedule.json')
    .then(response => response.json())
    .then(data => {
        database = data;
        if (localStorage.getItem('userGroup')) {
            renderApp();
        }
    })
    .catch(error => console.error("Ошибка:", error));

// Список специальностей
const specialtiesMap = {
    "09.02.01 Э": ["Э-1-23", "Э-1-24", "Э-1-25", "Э-1-26", "Э-2-23", "Э-2-24", "Э-2-25", "Э-2-26"],
    "09.02.06 СА": ["СА-1-23", "СА-1-24", "СА-1-25", "СА-1-26", "СА-2-23", "СА-2-24", "СА-2-25", "СА-3-23"],
    "09.02.07 ИС, БД, ВД": ["ИС-1-23", "ИС-1-24", "ИС-1-25", "ИС-11-24", "ИС-11-25", "ИС-2-23", "ИС-2-24", "ИС-2-25", "БД-1-23", "БД-1-24", "БД-1-25", "ВД-1-23", "ВД-1-24", "ВД-1-25"],
    "09.02.07 П,Т": ["П-1-23", "П-1-24", "П-1-25", "П-2-23", "П-2-24", "П-2-25", "Т-1-23", "Т-1-24", "Т-1-25"],
    "09.02.08 ИВ": ["ИВ-1-25", "ИВ-1-26"],
    "09.02.09 ВТ": ["ВТ-1-24", "ВТ-1-25", "ВТ-1-26", "ВТ-2-26"],
    "09.02.10 ДВР": ["ДВР-1-25", "ДВР-1-26"],
    "09.02.11 ПО": ["ПО-1-26", "ПО-2-26", "ПО-3-26", "ПО-4-26", "ПО-5-26", "ПО-6-26", "ПО-7-26"],
    "09.02.12 ПС": ["ПС-1-26", "ПС-2-26", "ПС-3-26", "ПС-4-26"],
    "09.02.13 ИИ": ["ИИ-1-25", "ИИ-1-26"],
    "10.02.05 БИ": ["БИ-1-24", "БИ-1-25", "БИ-11-26", "БИ-2-24", "БИ-2-25", "БИ-3-24", "БИ-3-25", "БИ-1-26", "БИ-2-26", "БИ-3-26", "БИ-4-26"],
    "25.02.08 БАС": ["БАС-1-24", "БАС-1-25", "БАС-1-26"],
    "40.02.04 Ю": ["Ю-1-24", "Ю-1-25", "Ю-1-26", "Ю-11-26", "Ю-2-24", "Ю-2-25", "Ю-2-26", "Ю-3-24"]
};

const dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
let tempSelectedSpecialty = "";

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
    tempSelectedSpecialty = spec;
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

// --- ОТОБРАЖЕНИЕ (УМНЫЙ ПОИСК) ---
function renderApp() {
    const group = localStorage.getItem('userGroup');
    const now = new Date();
    let todayIndex = now.getDay(); // 0-6
    let todayName = dayNames[todayIndex];
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let dateStr = now.toLocaleDateString('ru-RU', options);
    document.getElementById('current-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('today-name').textContent = todayName;

    // Ищем группу
    const groupKey = Object.keys(database).find(key => {
        const cleanKey = key.replace('Группа ', '').trim();
        return cleanKey.includes(group) || group.includes(cleanKey);
    });
    
    let scheduleForToday = [];
    let displayDayName = todayName;
    let isFallback = false;

    // Если на сегодня есть пары, берем их
    if (groupKey && database[groupKey][todayName] && database[groupKey][todayName].length > 0) {
        scheduleForToday = database[groupKey][todayName];
    } else {
        // Если на сегодня нет, ищем ближайший день с парами
        for (let i = 1; i <= 6; i++) {
            const nextIndex = (todayIndex + i) % 7;
            const nextName = dayNames[nextIndex];
            if (groupKey && database[groupKey][nextName] && database[groupKey][nextName].length > 0) {
                scheduleForToday = database[groupKey][nextName];
                displayDayName = nextName;
                isFallback = true;
                break;
            }
        }
    }

    // Рендер "Обзор"
    const overviewContainer = document.getElementById('today-schedule');
    if (scheduleForToday.length === 0) {
        overviewContainer.innerHTML = '<div class="grades-placeholder"><h3>Пар нет 😴</h3><p>На этой неделе расписание ещё не загрузили.</p></div>';
    } else {
        let html = '';
        // Если это не сегодняшний день, пишем, на какой день показываем
        if (isFallback) {
            html += `<div style="text-align:center; color: var(--text-secondary); margin-bottom: 15px; font-size: 14px;">Ближайший учебный день: <b>${displayDayName}</b></div>`;
        }
        scheduleForToday.forEach(l => {
            html += `<div class="lesson-card"><div class="lesson-num">${l.num}</div><div class="lesson-info"><h3>${l.name}</h3><p>${l.teacher}</p></div><div class="lesson-time"><span>${l.time.split(' - ')[0]}</span><span class="time-end">${l.time.split(' - ')[1]}</span></div></div>`;
        });
        overviewContainer.innerHTML = html;
    }

    // Рендер Недели
    const weekContainer = document.getElementById('full-week-schedule');
    let weekHtml = '';
    for (let i = 1; i <= 6; i++) {
        const dayName = dayNames[i];
        weekHtml += `<div class="day-title"><h2>${dayName}</h2><span class="badge">${group}</span></div>`;
        let daySchedule = [];
        if (groupKey && database[groupKey][dayName]) {
            daySchedule = database[groupKey][dayName];
        }
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
        if (Object.keys(database).length > 0) renderApp();
    }
};

function openGrades() { window.open("https://mpt.rea.ru/student/progress/journal", "_blank"); }
function openClassroom() { window.open("https://classroom.google.com", "_blank"); }
