// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const currentCourseId = urlParams.get('curso');

// Redirect to dashboard if no course ID
if (!currentCourseId) {
    window.location.href = 'index.html';
}

// Data structure
let appData = {
  students: [],
  evaluations: {
    cuatri1: [],
    cuatri2: [],
  },
  grades: {},
};

// DOM Elements
const btnAddStudent = document.getElementById("btn-add-student");
const btnExport = document.getElementById("btn-export");
const btnImport = document.getElementById("btn-import");
const fileInput = document.getElementById("file-input");
const modal = document.getElementById("modal-student");
const studentNameInput = document.getElementById("student-name-input");
const btnSaveStudent = document.getElementById("btn-save-student");
const btnCancelStudent = document.getElementById("btn-cancel-student");

// Initialize app
function init() {
  updatePageTitle();
  loadData();
  renderTables();
  attachEventListeners();
}

// Update page title with course name
function updatePageTitle() {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === currentCourseId);
    
    if (course) {
        document.getElementById('course-title').textContent = `📚 ${course.name}`;
        document.getElementById('course-subtitle').textContent = `Año ${course.year}`;
        document.title = `${course.name} - Sistema de Notas`;
    }
}

// Load data from localStorage (course-specific)
function loadData() {
  const savedData = localStorage.getItem(`${currentCourseId}_data`);
  if (savedData) {
    appData = JSON.parse(savedData);
  } else {
    // Initialize with default structure
    appData.evaluations.cuatri1 = [
      "Evaluación 1",
      "Evaluación 2",
      "Evaluación 3",
    ];
    appData.evaluations.cuatri2 = [
      "Evaluación 1",
      "Evaluación 2",
      "Evaluación 3",
    ];
  }
}

// Save data to localStorage (course-specific)
function saveData() {
  localStorage.setItem(`${currentCourseId}_data`, JSON.stringify(appData));
}

// Attach event listeners
function attachEventListeners() {
  btnAddStudent.addEventListener("click", openStudentModal);
  btnSaveStudent.addEventListener("click", saveStudent);
  btnCancelStudent.addEventListener("click", closeStudentModal);
  btnExport.addEventListener("click", exportData);
  btnImport.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", importData);

  // Add column buttons
  document.querySelectorAll(".btn-add-column").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const section = e.target.dataset.section;
      addEvaluationColumn(section);
    });
  });

  // Close modal on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeStudentModal();
  });
}

// Open student modal
function openStudentModal() {
  modal.classList.add("active");
  studentNameInput.value = "";
  studentNameInput.focus();
}

// Close student modal
function closeStudentModal() {
  modal.classList.remove("active");
}

// Save student
function saveStudent() {
  const name = studentNameInput.value.trim();
  if (name === "") {
    alert("Por favor ingrese un nombre");
    return;
  }

  const studentId = "student_" + Date.now();
  appData.students.push({ id: studentId, name });
  appData.grades[studentId] = {
    cuatri1: {},
    cuatri2: {},
  };

  saveData();
  renderTables();
  closeStudentModal();
}

// Delete student
function deleteStudent(studentId) {
  if (!confirm("¿Está seguro de eliminar este estudiante?")) return;

  appData.students = appData.students.filter((s) => s.id !== studentId);
  delete appData.grades[studentId];

  saveData();
  renderTables();
}

// Add evaluation column
function addEvaluationColumn(section) {
  const name = prompt(`Nombre de la nueva evaluación:`);
  if (!name) return;

  const key = section === "1" ? "cuatri1" : "cuatri2";
  appData.evaluations[key].push(name);

  saveData();
  renderTables();
}

// Render all tables
function renderTables() {
  renderEvaluationHeaders();
  renderStudentRows();
  renderFinalGrades();
}

// Render evaluation headers
function renderEvaluationHeaders() {
  // Cuatrimestre 1
  const evalRow1 = document.getElementById("evaluation-names-row-1");
  evalRow1.innerHTML = '<th class="fixed-col">Detalle</th>';

  appData.evaluations.cuatri1.forEach((evalName, index) => {
    const th = document.createElement("th");
    th.className = "evaluation-header";
    th.innerHTML = `<input type="text" value="${evalName}" data-section="1" data-index="${index}">`;
    evalRow1.appendChild(th);
  });

  // Average column
  const avgTh1 = document.createElement("th");
  avgTh1.className = "average-cell";
  avgTh1.textContent = "PROMEDIO 1ER CUATRI";
  evalRow1.appendChild(avgTh1);

  // Cuatrimestre 2
  const evalRow2 = document.getElementById("evaluation-names-row-2");
  evalRow2.innerHTML = '<th class="fixed-col">Detalle</th>';

  appData.evaluations.cuatri2.forEach((evalName, index) => {
    const th = document.createElement("th");
    th.className = "evaluation-header";
    th.innerHTML = `<input type="text" value="${evalName}" data-section="2" data-index="${index}">`;
    evalRow2.appendChild(th);
  });

  // Average column
  const avgTh2 = document.createElement("th");
  avgTh2.className = "average-cell";
  avgTh2.textContent = "PROMEDIO 2DO CUATRI";
  evalRow2.appendChild(avgTh2);

  // Add event listeners to evaluation name inputs
  document.querySelectorAll(".evaluation-header input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const section = e.target.dataset.section;
      const index = parseInt(e.target.dataset.index);
      const key = section === "1" ? "cuatri1" : "cuatri2";
      appData.evaluations[key][index] = e.target.value;
      saveData();
    });
  });
}

// Render student rows
function renderStudentRows() {
  const tbody1 = document.getElementById("students-body");
  const tbody2 = document.getElementById("students-body-2");

  tbody1.innerHTML = "";
  tbody2.innerHTML = "";

  appData.students.forEach((student) => {
    // Cuatrimestre 1
    const tr1 = document.createElement("tr");
    tr1.innerHTML = `
            <td class="fixed-col">
                <div class="student-name">
                    <span>${student.name}</span>
                    <button class="btn-delete-student" onclick="deleteStudent('${student.id}')">🗑️</button>
                </div>
            </td>
        `;

    appData.evaluations.cuatri1.forEach((_, index) => {
      const td = document.createElement("td");
      td.className = "grade-cell";
      const grade = appData.grades[student.id]?.cuatri1?.[index] || "";
      td.innerHTML = `<input type="number" min="0" max="10" step="0.1" value="${grade}" 
                data-student="${student.id}" data-section="1" data-index="${index}">`;
      tr1.appendChild(td);
    });

    // Average cell
    const avgTd1 = document.createElement("td");
    avgTd1.className = "average-cell";
    const avg1 = calculateAverage(student.id, "cuatri1");
    avgTd1.textContent = avg1.toFixed(2);
    applyGradeColor(avgTd1, avg1);
    tr1.appendChild(avgTd1);

    tbody1.appendChild(tr1);

    // Cuatrimestre 2
    const tr2 = document.createElement("tr");
    tr2.innerHTML = `
            <td class="fixed-col">
                <div class="student-name">
                    <span>${student.name}</span>
                    <button class="btn-delete-student" onclick="deleteStudent('${student.id}')">🗑️</button>
                </div>
            </td>
        `;

    appData.evaluations.cuatri2.forEach((_, index) => {
      const td = document.createElement("td");
      td.className = "grade-cell";
      const grade = appData.grades[student.id]?.cuatri2?.[index] || "";
      td.innerHTML = `<input type="number" min="0" max="10" step="0.1" value="${grade}" 
                data-student="${student.id}" data-section="2" data-index="${index}">`;
      tr2.appendChild(td);
    });

    // Average cell
    const avgTd2 = document.createElement("td");
    avgTd2.className = "average-cell";
    const avg2 = calculateAverage(student.id, "cuatri2");
    avgTd2.textContent = avg2.toFixed(2);
    applyGradeColor(avgTd2, avg2);
    tr2.appendChild(avgTd2);

    tbody2.appendChild(tr2);
  });

  // Add event listeners to grade inputs
  document.querySelectorAll(".grade-cell input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const studentId = e.target.dataset.student;
      const section = e.target.dataset.section;
      const index = parseInt(e.target.dataset.index);
      const value = parseFloat(e.target.value) || "";

      const key = section === "1" ? "cuatri1" : "cuatri2";
      if (!appData.grades[studentId]) {
        appData.grades[studentId] = { cuatri1: {}, cuatri2: {} };
      }
      appData.grades[studentId][key][index] = value;

      // Apply color coding
      if (value !== "") {
        applyGradeColor(e.target.parentElement, value);
      } else {
        e.target.parentElement.classList.remove("grade-pass", "grade-fail");
      }

      saveData();
      renderTables();
    });

    // Apply initial color
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      applyGradeColor(input.parentElement, value);
    }
  });
}

// Render final grades
function renderFinalGrades() {
  const finalBody = document.getElementById("final-body");
  finalBody.innerHTML = "";

  appData.students.forEach((student) => {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.className = "fixed-col";
    nameTd.textContent = student.name;
    tr.appendChild(nameTd);

    const avg1 = calculateAverage(student.id, "cuatri1");
    const avg2 = calculateAverage(student.id, "cuatri2");
    const finalGrade = (avg1 + avg2) / 2;

    const finalTd = document.createElement("td");
    finalTd.className = "final-col";
    finalTd.textContent = finalGrade.toFixed(2);
    tr.appendChild(finalTd);

    finalBody.appendChild(tr);
  });
}

// Calculate average
function calculateAverage(studentId, section) {
  const grades = appData.grades[studentId]?.[section] || {};
  const values = Object.values(grades).filter((g) => g !== "" && !isNaN(g));

  if (values.length === 0) return 0;

  const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
  return sum / values.length;
}

// Apply grade color
function applyGradeColor(element, grade) {
  element.classList.remove("grade-pass", "grade-fail");
  if (grade >= 7) {
    element.classList.add("grade-pass");
  } else if (grade > 0) {
    element.classList.add("grade-fail");
  }
}

// Export data
function exportData() {
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `notas_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import data
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      appData = JSON.parse(event.target.result);
      saveData();
      renderTables();
      alert("Datos importados correctamente");
    } catch (error) {
      alert("Error al importar datos: archivo inválido");
    }
  };
  reader.readAsText(file);
}

// Make deleteStudent global
window.deleteStudent = deleteStudent;

// Initialize on load
document.addEventListener("DOMContentLoaded", init);
