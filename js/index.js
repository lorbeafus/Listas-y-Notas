// Course management
let courses = [];
let editingCourseId = null;

// DOM Elements
const btnAddCourse = document.getElementById('btn-add-course');
const modal = document.getElementById('modal-course');
const courseNameInput = document.getElementById('course-name-input');
const courseSchoolInput = document.getElementById('course-school-input');
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

// Open course modal (create or edit)
function openCourseModal(courseId = null) {
    editingCourseId = courseId;
    const modalTitle = modal.querySelector('h2');
    const saveBtn = document.getElementById('btn-save-course');

    if (courseId) {
        const course = courses.find(c => c.id === courseId);
        if (!course) return;
        modalTitle.textContent = 'Editar Curso';
        saveBtn.textContent = 'Guardar Cambios';
        courseNameInput.value = course.name;
        courseSchoolInput.value = course.school || '';
        courseYearInput.value = course.year;
    } else {
        modalTitle.textContent = 'Crear Nuevo Curso';
        saveBtn.textContent = 'Crear Curso';
        courseNameInput.value = '';
        courseSchoolInput.value = '';
        courseYearInput.value = new Date().getFullYear();
    }

    modal.classList.add('active');
    courseNameInput.focus();
}

// Edit course (called from card)
function editCourse(courseId) {
    openCourseModal(courseId);
}

// Close course modal
function closeCourseModal() {
    modal.classList.remove('active');
}

// Save course (create or update)
function saveCourse() {
    const name = courseNameInput.value.trim();
    const school = courseSchoolInput.value.trim();
    const year = courseYearInput.value.trim();

    if (name === '') {
        alert('Por favor ingrese un nombre para el curso');
        return;
    }

    if (editingCourseId) {
        // Update existing course
        const course = courses.find(c => c.id === editingCourseId);
        if (course) {
            course.name = name;
            course.school = school;
            course.year = year || new Date().getFullYear();
        }
    } else {
        // Create new course
        const courseId = 'course_' + Date.now();
        const course = {
            id: courseId,
            name: name,
            school: school,
            year: year || new Date().getFullYear(),
            createdAt: new Date().toISOString()
        };
        courses.push(course);
    }

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
                    <div class="course-school">${course.school ? '🏫 ' + course.school : ''}</div>
                    <div class="course-year">Año ${course.year}</div>
                </div>
                <div class="course-card-actions">
                    <button class="btn-edit-course" onclick="event.stopPropagation(); editCourse('${course.id}')">
                        ✏️
                    </button>
                    <button class="btn-delete-course" onclick="event.stopPropagation(); deleteCourse('${course.id}')">
                        🗑️
                    </button>
                </div>
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
            <div class="course-actions">
                <button class="btn-course-action btn-notas" onclick="event.stopPropagation(); window.location.href='./pages/notas.html?curso=${course.id}'">
                    📝 Notas
                </button>
                <button class="btn-course-action btn-asistencia" onclick="event.stopPropagation(); window.location.href='./pages/asistencia.html?curso=${course.id}'">
                    📋 Asistencias
                </button>
            </div>
        `;

        coursesGrid.appendChild(card);
    });
}

// Make functions global
window.deleteCourse = deleteCourse;
window.editCourse = editCourse;

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
