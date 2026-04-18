// Course management
let courses = [];
let editingCourseId = null;
let draggedCard = null;
let draggedCourseId = null;

// DOM Elements
const btnAddCourse = document.getElementById('btn-add-course');
const btnExportData = document.getElementById('btn-export-data');
const btnImportData = document.getElementById('btn-import-data');
const inputImportData = document.getElementById('input-import-data');
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
    btnAddCourse.addEventListener('click', () => openCourseModal());
    btnExportData.addEventListener('click', exportData);
    btnImportData.addEventListener('click', () => inputImportData.click());
    inputImportData.addEventListener('change', importData);
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
        
        const card = document.createElement('article');
        card.className = 'course-card';
        card.draggable = true;
        card.dataset.courseId = course.id;
        card.innerHTML = `
            <div class="drag-handle" title="Mantener presionado para mover">⠿</div>
            <div class="course-icon"><img src="assets/img/logo_agenda.png" alt="Curso" style="width: 60px; height: 60px; object-fit: contain;"></div>
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

        // Drag events
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);

        coursesGrid.appendChild(card);
    });
}

// --- Drag & Drop handlers ---
function handleDragStart(e) {
    draggedCard = this;
    draggedCourseId = this.dataset.courseId;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedCourseId);
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.course-card').forEach(c => c.classList.remove('drag-over'));
    draggedCard = null;
    draggedCourseId = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this !== draggedCard) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (this === draggedCard) return;

    const targetCourseId = this.dataset.courseId;
    const fromIndex = courses.findIndex(c => c.id === draggedCourseId);
    const toIndex = courses.findIndex(c => c.id === targetCourseId);

    if (fromIndex === -1 || toIndex === -1) return;

    // Reorder array
    const [movedCourse] = courses.splice(fromIndex, 1);
    courses.splice(toIndex, 0, movedCourse);

    saveCourses();
    renderCourses();
}

// --- Import / Export Handlers ---
function exportData() {
    try {
        const dataToExport = {
            courses: courses,
            data: {}
        };
        
        courses.forEach(course => {
            const courseData = localStorage.getItem(`${course.id}_data`);
            if (courseData) {
                dataToExport.data[`${course.id}_data`] = JSON.parse(courseData);
            }
        });

        const dataStr = JSON.stringify(dataToExport);
        
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["⚠️ NO MODIFICAR ESTE ARCHIVO manualmente o podría romperse la copia de seguridad ⚠️"],
            ["Este archivo contiene los datos de tus notas y asistencias."],
            [dataStr] // Guardamos los datos en texto puro en la celda A3
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Backup_Data");
        
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `backup_agenda_${dateStr}.xlsx`);
        
    } catch(err) {
        alert("Hubo un error al exportar los datos: " + err.message);
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Los datos en JSON se encuentran en la celda A3
            const cellA3 = worksheet['A3'];
            if (!cellA3 || !cellA3.v) {
                throw new Error("El archivo Excel no parece ser una copia de seguridad oficial de esta App.");
            }

            const importedData = JSON.parse(cellA3.v);
            
            if (!importedData.courses) {
                throw new Error("El archivo no tiene el formato correcto.");
            }

            if(confirm("Estás a punto de reemplazar tus cursos actuales con esta copia de seguridad en Excel. ¡Toda la información actual que no esté en la copia se borrará!\n\n¿Estás seguro de continuar?")) {
                localStorage.setItem('courses', JSON.stringify(importedData.courses));
                
                if (importedData.data) {
                    for (const key in importedData.data) {
                        localStorage.setItem(key, JSON.stringify(importedData.data[key]));
                    }
                }
                alert("¡Datos restaurados con éxito! La página se recargará.");
                window.location.reload();
            }
        } catch (error) {
            alert('Error al leer el archivo. Asegúrate de que sea una copia en Excel válida: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    event.target.value = '';
}

// Make functions global
window.deleteCourse = deleteCourse;
window.editCourse = editCourse;

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
