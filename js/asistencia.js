// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const currentCourseId = urlParams.get('curso');

// Redirect to dashboard if no course ID
if (!currentCourseId) {
    window.location.href = 'index.html';
}

// Month configuration (Marzo-Diciembre with days and colors)
const MONTHS = [
    { name: 'MARZO', maxDays: 31, color: '#90EE90' },
    { name: 'ABRIL', maxDays: 30, color: '#87CEEB' },
    { name: 'MAYO', maxDays: 31, color: '#FFA500' },
    { name: 'JUNIO', maxDays: 30, color: '#FFB6C1' },
    { name: 'JULIO', maxDays: 31, color: '#D3D3D3' },
    { name: 'AGOSTO', maxDays: 31, color: '#87CEFA' },
    { name: 'SEPTIEMBRE', maxDays: 30, color: '#FFB6C1' },
    { name: 'OCTUBRE', maxDays: 31, color: '#90EE90' },
    { name: 'NOVIEMBRE', maxDays: 30, color: '#D8BFD8' },
    { name: 'DICIEMBRE', maxDays: 31, color: '#87CEEB' }
];

// Data structure
let students = [];
let attendanceData = {}; // { studentId: { 'MARZO-1': 'P', 'ABRIL-5': 'A', ... } }
let classDaysConfig = {}; // { 'MARZO': [1, 3, 5, 8, ...], 'ABRIL': [2, 4, 6, ...], ... }

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
    loadClassDaysConfig();
    renderCalendar();
    renderSummary();
    attachEventListeners();
}

// Attach event listeners
function attachEventListeners() {
    btnConfigureDays.addEventListener('click', openConfigModal);
    btnSaveConfig.addEventListener('click', saveClassDaysConfig);
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

// Load class days configuration
function loadClassDaysConfig() {
    const savedConfig = localStorage.getItem(`${currentCourseId}_classDays`);
    if (savedConfig) {
        classDaysConfig = JSON.parse(savedConfig);
    } else {
        // Initialize with empty arrays
        MONTHS.forEach(month => {
            classDaysConfig[month.name] = [];
        });
    }
}

// Save class days configuration
function saveClassDaysConfigToStorage() {
    localStorage.setItem(`${currentCourseId}_classDays`, JSON.stringify(classDaysConfig));
}

// Open configuration modal
function openConfigModal() {
    const container = document.getElementById('months-config-container');
    container.innerHTML = '';
    
    MONTHS.forEach(month => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-config';
        monthDiv.style.borderLeft = `4px solid ${month.color}`;
        
        const days = classDaysConfig[month.name] || [];
        const daysStr = days.join(', ');
        
        monthDiv.innerHTML = `
            <label for="config-${month.name}">${month.name}</label>
            <input 
                type="text" 
                id="config-${month.name}" 
                placeholder="Ej: 1, 3, 5, 8, 10, 12..."
                value="${daysStr}"
                data-month="${month.name}"
            >
            <small>Ingresa los días separados por comas</small>
        `;
        
        container.appendChild(monthDiv);
    });
    
    modal.classList.add('active');
}

// Close configuration modal
function closeConfigModal() {
    modal.classList.remove('active');
}

// Save class days configuration
function saveClassDaysConfig() {
    MONTHS.forEach(month => {
        const input = document.getElementById(`config-${month.name}`);
        const value = input.value.trim();
        
        if (value === '') {
            classDaysConfig[month.name] = [];
        } else {
            // Parse comma-separated numbers
            const days = value.split(',')
                .map(d => parseInt(d.trim()))
                .filter(d => !isNaN(d) && d >= 1 && d <= month.maxDays)
                .sort((a, b) => a - b);
            
            classDaysConfig[month.name] = [...new Set(days)]; // Remove duplicates
        }
    });
    
    saveClassDaysConfigToStorage();
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

    // Check if any class days are configured
    const hasConfiguredDays = MONTHS.some(month => classDaysConfig[month.name]?.length > 0);
    
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
        const days = classDaysConfig[month.name] || [];
        if (days.length > 0) {
            const th = document.createElement('th');
            th.className = 'month-header';
            th.colSpan = days.length;
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
        const days = classDaysConfig[month.name] || [];
        days.forEach(day => {
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

        // Day cells (only for configured days)
        MONTHS.forEach(month => {
            const days = classDaysConfig[month.name] || [];
            days.forEach(day => {
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
                        saveAttendance(e.target.dataset.student Id, e.target.dataset.key, val);
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
