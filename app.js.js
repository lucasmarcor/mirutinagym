// Rutinas por defecto
const initialData = {
  dayA: [
    { name: "Sentadilla", sets: [{ weight: 70, reps: 10, done: false }, { weight: 70, reps: 10, done: false }, { weight: 75, reps: 8, done: false }] },
    { name: "Press de Banca", sets: [{ weight: 60, reps: 10, done: false }, { weight: 60, reps: 10, done: false }, { weight: 65, reps: 8, done: false }] }
  ],
  dayB: [
    { name: "Peso Muerto", sets: [{ weight: 90, reps: 8, done: false }, { weight: 90, reps: 8, done: false }] },
    { name: "Press Militar", sets: [{ weight: 40, reps: 10, done: false }, { weight: 40, reps: 10, done: false }] }
  ],
  dayC: [
    { name: "Zancadas con Mancuernas", sets: [{ weight: 16, reps: 12, done: false }, { weight: 16, reps: 12, done: false }] },
    { name: "Dominadas", sets: [{ weight: 0, reps: 8, done: false }, { weight: 0, reps: 8, done: false }] }
  ]
};

// 1. Detección automática del día según la fecha de hoy
function getTodayDefaultDay() {
  const dayOfWeek = new Date().getDay(); // 0: Domingo, 1: Lunes, 2: Martes...
  switch (dayOfWeek) {
    case 1: // Lunes
    case 2: // Martes
      return 'dayA';
    case 3: // Miércoles
    case 4: // Jueves
      return 'dayB';
    case 5: // Viernes
    case 6: // Sábado
    case 0: // Domingo
      return 'dayC';
    default:
      return 'dayA';
  }
}

let activeDay = getTodayDefaultDay();
let timerInterval = null;

// Cargar o inicializar datos
function loadData() {
  const saved = localStorage.getItem('gymRoutineData');
  return saved ? JSON.parse(saved) : initialData;
}

function saveData(data) {
  localStorage.setItem('gymRoutineData', JSON.stringify(data));
}

let routineData = loadData();

// Sincronizar botones de la navegación de días
function updateDayButtonsUI() {
  document.querySelectorAll('.day-btn').forEach(btn => {
    if (btn.dataset.day === activeDay) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Renderizado principal
function render() {
  updateDayButtonsUI();

  const container = document.getElementById('exercises-container');
  container.innerHTML = '';

  const exercises = routineData[activeDay] || [];

  exercises.forEach((ex, exIdx) => {
    const card = document.createElement('div');
    card.className = 'exercise-card';

    let setsHTML = '';
    ex.sets.forEach((set, setIdx) => {
      setsHTML += `
        <div class="set-row ${set.done ? 'completed' : ''}">
          <span class="set-num">${setIdx + 1}</span>
          <div class="input-group">
            <button onclick="updateVal('${activeDay}', ${exIdx}, ${setIdx}, 'weight', -2.5)">-</button>
            <input type="number" value="${set.weight}" onchange="setVal('${activeDay}', ${exIdx}, ${setIdx}, 'weight', this.value)">
            <button onclick="updateVal('${activeDay}', ${exIdx}, ${setIdx}, 'weight', 2.5)">+</button>
          </div>
          <div class="input-group">
            <button onclick="updateVal('${activeDay}', ${exIdx}, ${setIdx}, 'reps', -1)">-</button>
            <input type="number" value="${set.reps}" onchange="setVal('${activeDay}', ${exIdx}, ${setIdx}, 'reps', 1)">
            <button onclick="updateVal('${activeDay}', ${exIdx}, ${setIdx}, 'reps', 1)">+</button>
          </div>
          <button class="check-btn" onclick="toggleSet('${activeDay}', ${exIdx}, ${setIdx})">
            ${set.done ? '✓' : ''}
          </button>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="exercise-header">
        <h3 onclick="editExerciseName(${exIdx})" style="cursor: pointer;" title="Toca para renombrar">
          ${ex.name} ✏️
        </h3>
        <button class="delete-btn" onclick="deleteExercise(${exIdx})">🗑️</button>
      </div>
      <div class="sets-header">
        <span>Serie</span>
        <span>Kg</span>
        <span>Reps</span>
        <span>Estado</span>
      </div>
      ${setsHTML}
      <button class="add-set-btn" onclick="addSet(${exIdx})">+ Agregar Serie</button>
    `;

    container.appendChild(card);
  });

  updateCalculations();
}

// 2. Función para editar el nombre de un ejercicio
function editExerciseName(exIdx) {
  const currentName = routineData[activeDay][exIdx].name;
  const newName = prompt('Nuevo nombre del ejercicio:', currentName);
  
  if (newName && newName.trim() !== '') {
    routineData[activeDay][exIdx].name = newName.trim();
    saveData(routineData);
    render();
  }
}

// Modificar valores de series
function updateVal(day, exIdx, setIdx, key, delta) {
  const set = routineData[day][exIdx].sets[setIdx];
  set[key] = Math.max(0, parseFloat((set[key] + delta).toFixed(1)));
  saveData(routineData);
  render();
}

function setVal(day, exIdx, setIdx, key, val) {
  const num = parseFloat(val);
  routineData[day][exIdx].sets[setIdx][key] = isNaN(num) ? 0 : Math.max(0, num);
  saveData(routineData);
  render();
}

function toggleSet(day, exIdx, setIdx) {
  const set = routineData[day][exIdx].sets[setIdx];
  set.done = !set.done;
  saveData(routineData);
  
  if (set.done) {
    startTimer(90); // Temporizador de 90 segundos
  }
  render();
}

function addSet(exIdx) {
  const sets = routineData[activeDay][exIdx].sets;
  const lastSet = sets[sets.length - 1] || { weight: 0, reps: 10, done: false };
  sets.push({ weight: lastSet.weight, reps: lastSet.reps, done: false });
  saveData(routineData);
  render();
}

function deleteExercise(exIdx) {
  if (confirm('¿Eliminar este ejercicio?')) {
    routineData[activeDay].splice(exIdx, 1);
    saveData(routineData);
    render();
  }
}

// Agregar nuevo ejercicio
document.getElementById('add-exercise-btn').addEventListener('click', () => {
  const input = document.getElementById('new-exercise-name');
  const name = input.value.trim();
  if (name) {
    routineData[activeDay].push({
      name: name,
      sets: [{ weight: 0, reps: 10, done: false }]
    });
    saveData(routineData);
    input.value = '';
    render();
  }
});

// Selector manual de día
document.querySelectorAll('.day-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    activeDay = e.target.dataset.day;
    render();
  });
});

// Cálculos de volumen total y barra de progreso
function updateCalculations() {
  const exercises = routineData[activeDay] || [];
  let totalVolume = 0;
  let totalSets = 0;
  let completedSets = 0;

  exercises.forEach(ex => {
    ex.sets.forEach(set => {
      totalSets++;
      if (set.done) {
        completedSets++;
        totalVolume += (set.weight * set.reps);
      }
    });
  });

  document.getElementById('volume-summary').innerText = `Volumen total: ${totalVolume} kg`;
  const percentage = totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
  document.getElementById('progress-bar').style.width = `${percentage}%`;
}

// Temporizador
function startTimer(seconds) {
  clearInterval(timerInterval);
  const banner = document.getElementById('timer-banner');
  const display = document.getElementById('timer-display');
  banner.classList.remove('hidden');

  let remaining = seconds;
  const updateDisplay = () => {
    const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
    const secs = (remaining % 60).toString().padStart(2, '0');
    display.innerText = `${mins}:${secs}`;
  };

  updateDisplay();
  timerInterval = setInterval(() => {
    remaining--;
    if (remaining < 0) {
      clearInterval(timerInterval);
      banner.classList.add('hidden');
    } else {
      updateDisplay();
    }
  }, 1000);
}

document.getElementById('close-timer-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  document.getElementById('timer-banner').classList.add('hidden');
});

// Inicialización
render();