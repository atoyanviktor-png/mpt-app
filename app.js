// Переключение вкладок
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// База данных расписания
const database = {
    "СА-1-26": {
        "Понедельник": [
            { num: "1", name: "История", teacher: "Л.В. Бегунова", time: "08:30 - 10:00" },
            { num: "2", name: "Русский язык", teacher: "Н.Е. Петкова", time: "10:10 - 11:40" },
            { num: "3", name: "Физика", teacher: "Д.Б. Магомедов", time: "12:00 - 13:30" },
            { num: "4", name: "Информатика", teacher: "Д.С. Городецкая", time: "13:50 - 15:20" }
        ],
        "Вторник": [],
        "Среда": [],
        "Четверг": [],
        "Пятница": [],
        "Суббота": [],
        "Воскресенье": []
    }
};

// Карта специальностей и групп
const specialtiesMap = {
    "09.02.06 СА": ["СА-1-26", "СА-2-26"],
    "09.02.12 ПС": ["ПС-1-26", "ПС-2-26", "ПС-3-26", "ПС-4-26"],
    "09.02.11 ПО": ["ПО-1-26", "ПО-2-26", "ПО-3-26"]
};

const dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
let tempSelectedSpecialty = "";

// Логика онбординга
function openSpecialties() {
    document.getElementById('specialty-modal').classList.add('active');
}

function selectSpecialty(spec) {
    tempSelectedSpecialty = spec;
    document.getElementById('specialty-modal').classList.remove('active');
    
    const groupList = document.getElementById('group-list');
    groupList.innerHTML = '';
    const groups = specialtiesMap[spec] || ["Группа не найдена"];
    
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
    if (!selectedGroup) {
        alert("Пожалуйста, выберите группу!");
        return;
    }
    
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('header-group-name').textContent = selectedGroup;
    document.getElementById('current-group-settings').textContent = selectedGroup;
    
    renderApp();
}

// Основная логика приложения
function renderApp() {
    const group = localStorage.getItem('userGroup') || 'СА-1-26';
    const now = new Date();
    const todayIndex = now.getDay();
    const todayName = dayNames[todayIndex];
    
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let dateStr = now.toLocaleDateString('ru-RU', options);
    document.getElementById('current-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    document.getElementById('today-name').textContent = todayName;

    // Рендер Обзора
    const scheduleForToday = (database[group] && database[group][todayName]) || [];
    const overviewContainer = document.getElementById('today-schedule');
    
    if (scheduleForToday.length === 0) {
        overviewContainer.innerHTML = '<div class="grades-placeholder"><h3>Выходной 🎉</h3><p>Сегодня пар нет!</p></div>';
    } else {
        let html = '';
        scheduleForToday.forEach(l => {
            html += `
                <div class="lesson-card">
                    <div class="lesson-num">${l.num}</div>
                    <div class="lesson-info"><h3>${l.name}</h3><p>${l.teacher}</p></div>
                    <div class="lesson-time"><span>${l.time.split(' - ')[0]}</span><span class="time-end">${l.time.split(' - ')[1]}</span></div>
                </div>`;
        });
        overviewContainer.innerHTML = html;
    }

    // Рендер Недели
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
                weekHtml += `
                    <div class="lesson-card">
                        <div class="lesson-num">${l.num}</div>
                        <div class="lesson-info"><h3>${l.name}</h3><p>${l.teacher}</p></div>
                        <div class="lesson-time"><span>${l.time.split(' - ')[0]}</span><span class="time-end">${l.time.split(' - ')[1]}</span></div>
                    </div>`;
            });
        }
    }
    weekContainer.innerHTML = weekHtml;
}

// Функция смены группы
function changeGroup() {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('onboarding-screen').style.display = 'flex';
}

// Старт приложения
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

// Вспомогательные функции
function openGrades() { window.open("https://mpt.rea.ru/student/progress/journal", "_blank"); }
function openClassroom() { window.open("https://classroom.google.com", "_blank"); }
function updateSchedule() { alert("Расписание обновлено!"); }
function contactDev() { alert("Связь с разработчиком: @твой_телеграм"); }
