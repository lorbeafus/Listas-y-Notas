// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const currentCourseId = urlParams.get('curso');

// Redirect to dashboard if no course ID
if (!currentCourseId) {
    window.location.href = 'index.html';
}

// Month configuration (Marzo-Diciembre with days and colors)
const MONTHS = [
    { name: 'MARZO', days: 31, color: '#90EE90' },
    { name: 'ABRIL', days: 30, color: '#87CEEB' },
    { name: 'MAYO', days: 31, color: '#FFA500' },
    { name: 'JUNIO', days: 30, color: '#FFB6C1' },
    { name: 'JULIO', days: 31, color: '#D3D3D3' },
    { name: 'AGOSTO', days: 31, color: '#87CEFA' },
    { name: 'SEPTIEMBRE', days: 30, color: '#FFB6C1' },
    { name: 'OCTUBRE', days: 31, color: '#90EE90' },
    { name: 'NOVIEMBRE', days: 30, color: '#D8BFD8' },
    { name: 'DICIEMBRE', days: 31, color: '#87CEEB' }
];

// Data structure
let students = [];
let attendanceData = {}; // { studentId: { 'MARZO-1': 'P', 'ABRIL-5': 'A', ... } }

// Initialize
function init() {
    updatePageTitle();
    loadStudents();
    loadAttendanceData();
    renderCalendar();
    renderSummary();
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

// Render calendar
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    container.innerHTML = '';

    // Create table
    const table = document.createElement('table');
    table.className = 'attendance-table';

    // Create header row with months
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th class="student-col">Estudiante</th>';
    
    MONTHS.forEach(month => {
        const th = document.createElement('th');
        th.className = 'month-header';
        th.colSpan = month.days;
        th.style.backgroundColor = month.color;
        th.textContent = month.name;
        headerRow.appendChild(th);
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
        for (let day = 1; day <= month.days; day++) {
            const th = document.createElement('th');
            th.className = 'day-cell';
            th.style.backgroundColor = month.color;
            th.textContent = day;
            dayRow.appendChild(th);
        }
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

        // Day cells
        MONTHS.forEach(month => {
            for (let day = 1; day <= month.days; day++) {
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
            }
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
