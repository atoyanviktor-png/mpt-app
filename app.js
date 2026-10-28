// Переключение вкладок
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// --- ЗАГРУЗКА РАСПИСАНИЯ ИЗ ФАЙЛА ---
let database = {}; 

fetch('all_schedule.json')
    .then(response => response.json())
    .then(data => {
        database = data;
        console.log("Расписание загружено! Групп:", Object.keys(database).length);
        
        // Если группа уже выбрана, обновляем экран
        if (localStorage.getItem('userGroup')) {
            renderApp();
        }
    })
    .catch(error => {
        console.error("Ошибка загрузки расписания:", error);
        alert("Не удалось загрузить расписание. Проверь интернет.");
    });

// Список специальностей для выбора
const specialtiesMap = {
    "09.02.06 СА": ["СА-1-23", "СА-1-24", "СА-1-25", "СА-1-26", "СА-2-23", "СА-2-24", "СА-2-25", "СА-3-23"],
    "09.02.07 ИС": ["ИС-1-23", "ИС-1-24", "ИС-1-25", "ИС-11-24", "ИС-11-25", "ИС-2-23", "ИС-2-24", "ИС-2-25"],
    "09.02.08 ИВ": ["ИВ-1-25"],
    "09.02.11 ПО": ["ПО-1-26", "ПО-2-26", "ПО-3-26", "ПО-4-26", "ПО-5-26", "ПО-6-26", "ПО-7-26"],
    "09.02.12 ПС": ["ПС-1-26", "ПС-2-26", "ПС-3-26", "ПС-4-26"],
    "09.02.13 ИИ": ["ИИ-1-25"],
    "10.02.05 БИ": ["БИ-1-24", "БИ-1-25", "БИ-11-26", "БИ-2-24", "БИ-2-25", "БИ-3-24", "БИ-3-25"],
    "25.02.08 БАС": ["БАС-1-24", "БАС-1-25"],
    "40.02.04 Ю": ["Ю-1-24", "Ю-1-25", "Ю-1-26", "Ю-11-26", "Ю-2-24", "Ю-2-25", "Ю-2-26", "Ю-3-24"]
};

const dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
let tempSelectedSpecialty = "";

// --- ЛОГИКА ВЫБОРА ГРУППЫ ---
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

// --- ОТОБРАЖЕНИЕ РАСПИСАНИЯ ---
function renderApp() {
    const group = localStorage.getItem('userGroup') || 'СА-1-26';
    const now = new Date();
    const todayIndex = now.getDay();
    const todayName = dayNames[todayIndex];
    
    // Ставим текущую дату
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let dateStr = now.toLocaleDateString('ru-RU', options);
    document.getElementById('current-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('today-name').textContent = todayName;

    // Ищем расписание для выбранной группы и дня
    // (парсер сохранил группы в виде "Группа СА-1-26", поэтому мы ищем по вхождению)
    let scheduleForToday = [];
    const groupKey = Object.keys(database).find(key => key.includes(group));
    
    if (groupKey && database[groupKey][todayName]) {
        scheduleForToday = database[groupKey][todayName];
    }

    // Рендер "Обзор" (на сегодня)
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

    // Рендер "Неделя" (с понедельника по субботу)
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

// Смена группы
function changeGroup() {
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('onboarding-screen').style.display = 'flex';
}

// --- СТАРТ ПРИЛОЖЕНИЯ ---
window.onload = function() {
    const savedGroup = localStorage.getItem('userGroup');
    if (savedGroup) {
        document.getElementById('onboarding-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'block';
        document.getElementById('header-group-name').textContent = savedGroup;
        document.getElementById('current-group-settings').textContent = savedGroup;
        
        // Подождем загрузки данных (они загружаются асинхронно через fetch)
        // Если данные уже есть, рендерим сразу
        if (Object.keys(database).length > 0) {
            renderApp();
        }
    }
};

// Вспомогательные функции
function openGrades() { window.open("https://mpt.rea.ru/student/progress/journal", "_blank"); }
function openClassroom() { window.open("https://classroom.google.com", "_blank"); }
function updateSchedule() { alert("Для обновления расписания обнови страницу."); }
function contactDev() { alert("Связь с разработчиком: @твой_телеграм"); }
