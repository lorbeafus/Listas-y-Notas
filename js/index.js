// Course management
let courses = [];

// DOM Elements
const btnAddCourse = document.getElementById('btn-add-course');
const modal = document.getElementById('modal-course');
const courseNameInput = document.getElementById('course-name-input');
const courseYearInput = document.getElementById('course-year-input');
const btnSaveCourse = document.getElementById('btn-save-course');
const btnCancelCourse = document.getElementById('btn-cancel-course');
const coursesGrid = document.getElementById('courses-grid');
const emptyState = document.getElementById('empty-state');

// Initialize
function init() {
    loadCourses();
    renderCourses();
    attachEventListeners();
}

// Load courses from localStorage
function loadCourses() {
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
        courses = JSON.parse(savedCourses);
    }
}

// Save courses to localStorage
function saveCourses() {
    localStorage.setItem('courses', JSON.stringify(courses));
}

// Attach event listeners
function attachEventListeners() {
    btnAddCourse.addEventListener('click', openCourseModal);
    btnSaveCourse.addEventListener('click', saveCourse);
    btnCancelCourse.addEventListener('click', closeCourseModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCourseModal();
    });

    // Enter key to save
    courseNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveCourse();
    });
    courseYearInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveCourse();
    });
}

// Open course modal
function openCourseModal() {
    modal.classList.add('active');
    courseNameInput.value = '';
    courseYearInput.value = new Date().getFullYear();
    courseNameInput.focus();
}

// Close course modal
function closeCourseModal() {
    modal.classList.remove('active');
}

// Save course
function saveCourse() {
    const name = courseNameInput.value.trim();
    const year = courseYearInput.value.trim();

    if (name === '') {
        alert('Por favor ingrese un nombre para el curso');
        return;
    }

    const courseId = 'course_' + Date.now();
    const course = {
        id: courseId,
        name: name,
        year: year || new Date().getFullYear(),
        createdAt: new Date().toISOString()
    };

    courses.push(course);
    saveCourses();
    renderCourses();
    closeCourseModal();
}

// Delete course
function deleteCourse(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (!confirm(`¿Está seguro de eliminar el curso "${course.name}"?\n\nEsto eliminará todos los datos de estudiantes y notas asociados.`)) {
        return;
    }

    // Remove course from list
    courses = courses.filter(c => c.id !== courseId);
    saveCourses();

    // Remove course data from localStorage
    localStorage.removeItem(`${courseId}_data`);

    renderCourses();
}

// Get course stats
function getCourseStats(courseId) {
    const data = localStorage.getItem(`${courseId}_data`);
    if (!data) {
        return { students: 0, evaluations: 0 };
    }

    const courseData = JSON.parse(data);
    return {
        students: courseData.students?.length || 0,
        evaluations: (courseData.evaluations?.cuatri1?.length || 0) + (courseData.evaluations?.cuatri2?.length || 0)
    };
}

// Render courses
function renderCourses() {
    if (courses.length === 0) {
        coursesGrid.style.display = 'none';
        emptyState.classList.add('active');
        return;
    }

    coursesGrid.style.display = 'grid';
    emptyState.classList.remove('active');
    coursesGrid.innerHTML = '';

    courses.forEach(course => {
        const stats = getCourseStats(course.id);
        
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-icon">📚</div>
            <div class="course-header">
                <div class="course-info">
                    <h3>${course.name}</h3>
                    <div class="course-year">Año ${course.year}</div>
                </div>
                <button class="btn-delete-course" onclick="event.stopPropagation(); deleteCourse('${course.id}')">
                    🗑️
                </button>
            </div>
            <div class="course-stats">
                <div class="stat">
                    <span class="stat-label">Estudiantes</span>
                    <span class="stat-value">${stats.students}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Evaluaciones</span>
                    <span class="stat-value">${stats.evaluations}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `notas.html?curso=${course.id}`;
        });

        coursesGrid.appendChild(card);
    });
}

// Make deleteCourse global
window.deleteCourse = deleteCourse;

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
