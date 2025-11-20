// ----------------------
// VARIABLES Y ELEMENTOS
// ----------------------
const addStudentBtn = document.getElementById('addStudent');
const sendListBtn = document.getElementById('sendList');
const studentTable = document.querySelector('#studentTable tbody');
const spinner = document.createElement('span');

spinner.style.cssText = `
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 3px solid #ccc;
  border-top-color: #2980b9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-left: 10px;
  vertical-align: middle;
`;
spinner.style.display = 'none';
sendListBtn.parentNode.insertBefore(spinner, sendListBtn.nextSibling);

let students = [];
let studentsSent = [];
let editIndex = -1;

// ----------------------
// AGREGAR / EDITAR ESTUDIANTE
// ----------------------
addStudentBtn.addEventListener('click', () => {
  const nombres = document.getElementById('nombre').value.trim();
  const areas = document.getElementById('area').value;
  const maestros = document.getElementById('maestro').value;
  const calificacion = document.getElementById('nota').value;
  const observacion = document.getElementById('observacion').value.trim();

  if (!nombres || !areas || !maestros || !calificacion || !observacion) {
    alert('Por favor, complete todos los campos.');
    return;
  }

  if (editIndex === -1) {
    students.push({ nombres, areas, maestros, calificacion, observacion });
  } else {
    students[editIndex] = { nombres, areas, maestros, calificacion, observacion };
    editIndex = -1;
    addStudentBtn.textContent = 'Agregar Estudiante';
  }

  updateTable();
  document.getElementById('studentForm').reset();
});

function updateTable() {
  studentTable.innerHTML = '';
  students.forEach((student, index) => {
    studentTable.innerHTML += `
    <tr>
    <td>${student.nombres}</td>
    <td>${student.areas}</td>
    <td>${student.maestros}</td>
    <td>${student.calificacion}</td>
    <td>${student.observacion}</td>
    <td>
      <button onclick="editStudent(${index})" class="btn-edit">Editar</button>
      <button onclick="deleteStudent(${index})" class="btn-delete">Eliminar</button>
    </td>
  </tr>  
    `;
  });
}

function deleteStudent(index) {
  students.splice(index, 1);
  updateTable();
}

function editStudent(index) {
  editIndex = index;
  const student = students[index];
  document.getElementById('nombre').value = student.nombres;
  document.getElementById('area').value = student.areas;
  document.getElementById('maestro').value = student.maestros;
  document.getElementById('nota').value = student.calificacion;
  document.getElementById('observacion').value = student.observacion;
  addStudentBtn.textContent = 'Actualizar Estudiante';
}

// ----------------------
// ENVIAR LISTA A SHEET.BEST
// ----------------------
sendListBtn.addEventListener('click', () => {
  if (students.length === 0) {
    alert('No hay estudiantes registrados.');
    return;
  }

  spinner.style.display = 'inline-block';
  sendListBtn.disabled = true;

  fetch('https://api.sheetbest.com/sheets/f2e36ed5-1337-44fa-b20f-be19683cf8bd', {
    method: 'POST',
    body: JSON.stringify(students),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.text())
  .then(() => {
    spinner.style.display = 'none';
    sendListBtn.disabled = false;
    studentsSent = [...students];
    students = [];
    updateTable();
    showModal();
  })
  .catch(err => {
    spinner.style.display = 'none';
    sendListBtn.disabled = false;
    alert('Error al enviar los datos');
    console.error(err);
  });
});

// ----------------------
// MODAL
// ----------------------
function showModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('descargarPDF').style.display = 'inline-block';
  }
}

document.getElementById('cerrar-modal').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

document.getElementById('descargarPDF').addEventListener('click', () => {
  generatePDF();
  document.getElementById('modal').style.display = 'none';
});

// ----------------------
// GENERAR PDF CON jsPDF + autotable
// ----------------------
function generatePDF() {
  if (studentsSent.length === 0) {
    alert('No hay datos para generar PDF.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Lista de Estudiantes con Dificultades - 3° Trimestre', 105, 15, { align: 'center' });

  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-ES');
  const hora = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const curso = "2do de Secundaria";
  
  doc.setFontSize(10);
  
  // Curso a la izquierda
  doc.text(`Curso: ${curso}`, 14, 22);
  
  // Fecha y hora a la derecha
  const pageWidth = doc.internal.pageSize.getWidth();
  const textoDerecha = `Fecha: ${fecha}   Hora: ${hora}`;
  const textWidth = doc.getTextWidth(textoDerecha);
  doc.text(textoDerecha, pageWidth - textWidth - 14, 22);
  

  const data = studentsSent.map(s => [s.nombres, s.areas, s.maestros, s.calificacion, s.observacion]);

  doc.autoTable({
    head: [['Nombre', 'Área', 'Maestro(a)', 'Nota', 'Observación']],
    body: data,
    startY: 28,
    styles: { fontSize: 10 }
  });

  let finalY = doc.lastAutoTable.finalY + 20;
  doc.text('Firma del maestro(a): ____________________________', 14, finalY);

  doc.save('lista_posibles_reprobaciones.pdf');
}

// ----------------------
// ANIMACIÓN SPINNER
// ----------------------
const style = document.createElement('style');
style.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}`;
document.head.appendChild(style);
