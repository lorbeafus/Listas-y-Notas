// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const currentCourseId = urlParams.get('curso');

// Redirect to dashboard if no course ID
if (!currentCourseId) {
    window.location.href = 'index.html';
}

// Month configuration (Marzo-Diciembre with colors)
const MONTHS = [
    { name: 'MARZO', number: 3, color: '#90EE90' },
    { name: 'ABRIL', number: 4, color: '#87CEEB' },
    { name: 'MAYO', number: 5, color: '#FFA500' },
    { name: 'JUNIO', number: 6, color: '#FFB6C1' },
    { name: 'JULIO', number: 7, color: '#D3D3D3' },
    { name: 'AGOSTO', number: 8, color: '#87CEFA' },
    { name: 'SEPTIEMBRE', number: 9, color: '#FFB6C1' },
    { name: 'OCTUBRE', number: 10, color: '#90EE90' },
    { name: 'NOVIEMBRE', number: 11, color: '#D8BFD8' },
    { name: 'DICIEMBRE', number: 12, color: '#87CEEB' }
];

const WEEKDAYS = [
    { name: 'Lunes', value: 1 },
    { name: 'Martes', value: 2 },
    { name: 'Miércoles', value: 3 },
    { name: 'Jueves', value: 4 },
    { name: 'Viernes', value: 5 }
];

// Data structure
let students = [];
let attendanceData = {}; // { studentId: { 'MARZO-1': 'P', 'ABRIL-5': 'A', ... } }
let weekdayConfig = {}; // { 'MARZO': [1, 3, 5], 'ABRIL': [1, 3, 5], ... } (días de la semana)
let courseYear = new Date().getFullYear();

// DOM Elements
const btnConfigureDays = document.getElementById('btn-configure-days');
const modal = document.getElementById('modal-configure-days');
const btnSaveConfig = document.getElementById('btn-save-config');
const btnCancelConfig = document.getElementById('btn-cancel-config');

// Initialize
function init() {
    updatePageTitle();
    loadStudents();
    loadAttendanceData();
    loadWeekdayConfig();
    renderCalendar();
    renderSummary();
    attachEventListeners();
}

// Attach event listeners
function attachEventListeners() {
    btnConfigureDays.addEventListener('click', openConfigModal);
    btnSaveConfig.addEventListener('click', saveWeekdayConfig);
    btnCancelConfig.addEventListener('click', closeConfigModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeConfigModal();
    });
}

// Update page title
function updatePageTitle() {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === currentCourseId);
    
    if (course) {
        courseYear = parseInt(course.year) || new Date().getFullYear();
        document.getElementById('course-title').textContent = `📋 Asistencias - ${course.name}`;
        document.getElementById('course-subtitle').textContent = `Año ${course.year}`;
        document.title = `Asistencias - ${course.name}`;
    }
}

// Load students from course data
function loadStudents() {
    const courseData = localStorage.getItem(`${currentCourseId}_data`);
    if (courseData) {
        const data = JSON.parse(courseData);
        students = data.students || [];
    }
}

// Load attendance data
function loadAttendanceData() {
    const savedData = localStorage.getItem(`${currentCourseId}_attendance`);
    if (savedData) {
        attendanceData = JSON.parse(savedData);
    }
}

// Save attendance data
function saveAttendanceData() {
    localStorage.setItem(`${currentCourseId}_attendance`, JSON.stringify(attendanceData));
}

// Load weekday configuration
function loadWeekdayConfig() {
    const savedConfig = localStorage.getItem(`${currentCourseId}_weekdays`);
    if (savedConfig) {
        weekdayConfig = JSON.parse(savedConfig);
    } else {
        // Initialize with empty arrays
        MONTHS.forEach(month => {
            weekdayConfig[month.name] = [];
        });
    }
}

// Save weekday configuration
function saveWeekdayConfigToStorage() {
    localStorage.setItem(`${currentCourseId}_weekdays`, JSON.stringify(weekdayConfig));
}

// Get dates for specific weekdays in a month
function getDatesForWeekdays(year, month, weekdays) {
    if (!weekdays || weekdays.length === 0) return [];
    
    const dates = [];
    const date = new Date(year, month - 1, 1); // month is 1-indexed
    
    // Iterate through all days in the month
    while (date.getMonth() === month - 1) {
        const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        
        // Convert to our format (1=Monday, 2=Tuesday, ..., 5=Friday)
        const ourDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
        
        if (weekdays.includes(ourDayOfWeek)) {
            dates.push(date.getDate());
        }
        
        date.setDate(date.getDate() + 1);
    }
    
    return dates;
}

// Open configuration modal
function openConfigModal() {
    const container = document.getElementById('months-config-container');
    container.innerHTML = '';
    
    MONTHS.forEach(month => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-config';
        monthDiv.style.borderLeft = `4px solid ${month.color}`;
        
        const selectedWeekdays = weekdayConfig[month.name] || [];
        
        let checkboxesHtml = '';
        WEEKDAYS.forEach(weekday => {
            const checked = selectedWeekdays.includes(weekday.value) ? 'checked' : '';
            checkboxesHtml += `
                <label class="weekday-checkbox">
                    <input 
                        type="checkbox" 
                        value="${weekday.value}"
                        data-month="${month.name}"
                        ${checked}
                    >
                    <span>${weekday.name}</span>
                </label>
            `;
        });
        
        monthDiv.innerHTML = `
            <div class="month-header-config">${month.name}</div>
            <div class="weekday-checkboxes">
                ${checkboxesHtml}
            </div>
        `;
        
        container.appendChild(monthDiv);
    });
    
    modal.classList.add('active');
}

// Close configuration modal
function closeConfigModal() {
    modal.classList.remove('active');
}

// Save weekday configuration
function saveWeekdayConfig() {
    MONTHS.forEach(month => {
        const checkboxes = document.querySelectorAll(`input[type="checkbox"][data-month="${month.name}"]`);
        const selectedWeekdays = [];
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedWeekdays.push(parseInt(checkbox.value));
            }
        });
        
        weekdayConfig[month.name] = selectedWeekdays;
    });
    
    saveWeekdayConfigToStorage();
    closeConfigModal();
    renderCalendar();
    renderSummary();
}

// Render calendar
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<p class="no-data">No hay estudiantes en este curso. Agrega estudiantes desde la sección de Notas.</p>';
        return;
    }

    // Check if any weekdays are configured
    const hasConfiguredDays = MONTHS.some(month => weekdayConfig[month.name]?.length > 0);
    
    if (!hasConfiguredDays) {
        container.innerHTML = '<p class="no-data">No hay días de clase configurados. Haz clic en "⚙️ Configurar Días de Clase" para empezar.</p>';
        return;
    }

    // Create table
    const table = document.createElement('table');
    table.className = 'attendance-table';

    // Create header row with months
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th class="student-col">Estudiante</th>';
    
    MONTHS.forEach(month => {
        const weekdays = weekdayConfig[month.name] || [];
        const dates = getDatesForWeekdays(courseYear, month.number, weekdays);
        
        if (dates.length > 0) {
            const th = document.createElement('th');
            th.className = 'month-header';
            th.colSpan = dates.length;
            th.style.backgroundColor = month.color;
            th.textContent = month.name;
            headerRow.appendChild(th);
        }
    });

    // Add summary columns
    headerRow.innerHTML += `
        <th class="summary-col">ASISTENCIA<br>1ER CUATRI</th>
        <th class="summary-col">ASISTENCIA<br>2DO CUATRI</th>
        <th class="summary-col">CLASES<br>TOTALES</th>
    `;
    
    table.appendChild(headerRow);

    // Create day numbers row
    const dayRow = document.createElement('tr');
    dayRow.innerHTML = '<th class="student-col">Detalle</th>';
    
    MONTHS.forEach(month => {
        const weekdays = weekdayConfig[month.name] || [];
        const dates = getDatesForWeekdays(courseYear, month.number, weekdays);
        
        dates.forEach(day => {
            const th = document.createElement('th');
            th.className = 'day-cell';
            th.style.backgroundColor = month.color;
            th.textContent = day;
            dayRow.appendChild(th);
        });
    });

    // Add empty cells for summary columns
    dayRow.innerHTML += '<th></th><th></th><th></th>';
    table.appendChild(dayRow);

    // Create student rows
    students.forEach(student => {
        const row = document.createElement('tr');
        
        // Student name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'student-col';
        nameCell.textContent = student.name;
        row.appendChild(nameCell);

        // Day cells (only for configured weekdays)
        MONTHS.forEach(month => {
            const weekdays = weekdayConfig[month.name] || [];
            const dates = getDatesForWeekdays(courseYear, month.number, weekdays);
            
            dates.forEach(day => {
                const cell = document.createElement('td');
                cell.className = 'attendance-cell';
                cell.style.backgroundColor = month.color;
                
                const key = `${month.name}-${day}`;
                const value = attendanceData[student.id]?.[key] || '';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.value = value;
                input.dataset.studentId = student.id;
                input.dataset.key = key;
                input.dataset.month = month.name;
                
                input.addEventListener('input', (e) => {
                    const val = e.target.value.toUpperCase();
                    if (val === '' || val === 'P' || val === 'A' || val === 'R') {
                        e.target.value = val;
                        saveAttendance(e.target.dataset.studentId, e.target.dataset.key, val);
                    } else {
                        e.target.value = '';
                    }
                });
                
                cell.appendChild(input);
                row.appendChild(cell);
            });
        });

        // Calculate and display summaries
        const cuatri1Months = ['MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO'];
        const cuatri2Months = ['AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        
        const cuatri1Stats = calculateAttendance(student.id, cuatri1Months);
        const cuatri2Stats = calculateAttendance(student.id, cuatri2Months);
        const totalClasses = cuatri1Stats.total + cuatri2Stats.total;

        // Summary cells
        row.innerHTML += `
            <td class="summary-col">${cuatri1Stats.percentage.toFixed(0)}%</td>
            <td class="summary-col">${cuatri2Stats.percentage.toFixed(0)}%</td>
            <td class="summary-col">${totalClasses}</td>
        `;

        table.appendChild(row);
    });

    container.appendChild(table);
}

// Save attendance
function saveAttendance(studentId, key, value) {
    if (!attendanceData[studentId]) {
        attendanceData[studentId] = {};
    }
    
    if (value === '') {
        delete attendanceData[studentId][key];
    } else {
        attendanceData[studentId][key] = value;
    }
    
    saveAttendanceData();
    renderSummary();
}

// Calculate attendance for specific months
function calculateAttendance(studentId, months) {
    let totalClasses = 0;
    let attendancePoints = 0;

    if (!attendanceData[studentId]) {
        return { percentage: 0, total: 0 };
    }

    Object.keys(attendanceData[studentId]).forEach(key => {
        const [month] = key.split('-');
        if (months.includes(month)) {
            const value = attendanceData[studentId][key];
            if (value === 'P' || value === 'A' || value === 'R') {
                totalClasses++;
                if (value === 'P') {
                    attendancePoints += 1;
                } else if (value === 'R') {
                    attendancePoints += 0.5;
                }
            }
        }
    });

    const percentage = totalClasses > 0 ? (attendancePoints / totalClasses) * 100 : 0;
    return { percentage, total: totalClasses };
}

// Render summary
function renderSummary() {
    const container = document.getElementById('summary-container');
    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<p class="no-data">No hay estudiantes en este curso.</p>';
        return;
    }

    students.forEach(student => {
        const cuatri1Months = ['MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO'];
        const cuatri2Months = ['AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        
        const cuatri1Stats = calculateAttendance(student.id, cuatri1Months);
        const cuatri2Stats = calculateAttendance(student.id, cuatri2Months);

        const card = document.createElement('div');
        card.className = 'summary-card';
        card.innerHTML = `
            <h3>${student.name}</h3>
            <div class="stats-row">
                <div class="stat-item">
                    <span class="stat-label">1er Cuatrimestre</span>
                    <span class="stat-value ${cuatri1Stats.percentage >= 75 ? 'good' : 'bad'}">${cuatri1Stats.percentage.toFixed(0)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">2do Cuatrimestre</span>
                    <span class="stat-value ${cuatri2Stats.percentage >= 75 ? 'good' : 'bad'}">${cuatri2Stats.percentage.toFixed(0)}%</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
