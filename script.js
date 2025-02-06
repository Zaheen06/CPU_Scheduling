document.addEventListener("DOMContentLoaded", () => {
  const processTable = document.querySelector("#processTable tbody");
  const avgTAT = document.querySelector("#avgTAT");
  const avgWT = document.querySelector("#avgWT");
  const ganttChart = document.querySelector("#chart");
  const timeLabels = document.querySelector("#timeLabels");
  const algorithmSelect = document.querySelector("#algorithm");
  const quantumInput = document.querySelector("#quantum");
  const priorityHeader = document.querySelector("#priorityHeader");
  const resetBtn = document.querySelector("#reset");

  let processes = [];

  // Show/hide inputs based on algorithm selection.
  algorithmSelect.addEventListener("change", () => {
    if (algorithmSelect.value === "rr") {
      quantumInput.style.display = "block";
      priorityHeader.style.display = "none";
    } else if (algorithmSelect.value.includes("priority")) {
      priorityHeader.style.display = "table-cell";
      quantumInput.style.display = "none";
    } else {
      quantumInput.style.display = "none";
      priorityHeader.style.display = "none";
    }
  });

  // Add a process via prompt.
  document.querySelector("#addProcess").addEventListener("click", () => {
    const processId = `P${processes.length + 1}`;
    const arrivalTime = parseInt(prompt("Enter Arrival Time:"));
    const burstTime = parseInt(prompt("Enter Burst Time:"));
    let priority = null;
    if (algorithmSelect.value.includes("priority")) {
      priority = parseInt(prompt("Enter Priority (Lower number = Higher priority):"));
    }
    if (!isNaN(arrivalTime) && !isNaN(burstTime) && (priority === null || !isNaN(priority))) {
      processes.push({ id: processId, arrivalTime, burstTime, priority });
      renderTable();
    } else {
      alert("Invalid input. Please enter numeric values.");
    }
  });

  // Calculate scheduling based on selection.
  document.querySelector("#calculate").addEventListener("click", () => {
    // Clear previous Gantt chart.
    ganttChart.innerHTML = "";
    timeLabels.innerHTML = "";

    const algorithm = algorithmSelect.value;
    const quantum = parseInt(quantumInput.value);
    // Clear computed properties.
    processes.forEach(p => {
      delete p.tat;
      delete p.wt;
      delete p.remainingTime;
      delete p.completed;
      delete p.finishTime;
    });
    if (algorithm === "fcfs") {
      calculateFCFS();
    } else if (algorithm === "fcfs-preemptive") {
      // For demonstration, FCFS Preemptive is treated as FCFS.
      calculateFCFS();
    } else if (algorithm === "sjf") {
      calculateSJF();
    } else if (algorithm === "srtf") {
      calculateSRTF();
    } else if (algorithm === "priority") {
      calculatePriority(false);
    } else if (algorithm === "priority-preemptive") {
      calculatePriority(true);
    } else if (algorithm === "rr") {
      if (!isNaN(quantum) && quantum > 0) {
        calculateRR(quantum);
      } else {
        alert("Please enter a valid time quantum.");
      }
    }
  });

  // Reset button: clear all processes and displays.
  resetBtn.addEventListener("click", () => {
    processes = [];
    processTable.innerHTML = "";
    ganttChart.innerHTML = "";
    timeLabels.innerHTML = "";
    avgTAT.textContent = "0";
    avgWT.textContent = "0";
  });

  // Render the process table.
  function renderTable() {
    processTable.innerHTML = "";
    processes.forEach((process) => {
      let rowHTML = `<td>${process.id}</td>
                     <td>${process.arrivalTime}</td>
                     <td>${process.burstTime}</td>`;
      if (algorithmSelect.value.includes("priority")) {
        rowHTML += `<td>${process.priority !== null ? process.priority : ""}</td>`;
      }
      rowHTML += `<td>${process.tat !== undefined ? process.tat : ""}</td>
                  <td>${process.wt !== undefined ? process.wt : ""}</td>`;
      const row = document.createElement("tr");
      row.innerHTML = rowHTML;
      processTable.appendChild(row);
    });
  }

  // Render the Gantt Chart.
  function renderGantt(segments) {
    ganttChart.innerHTML = "";
    timeLabels.innerHTML = "";
    segments.forEach(seg => {
      const block = document.createElement("div");
      block.textContent = seg.id;
      ganttChart.appendChild(block);
      const timeLabel = document.createElement("div");
      timeLabel.textContent = seg.start;
      timeLabels.appendChild(timeLabel);
    });
    if (segments.length > 0) {
      const finalLabel = document.createElement("div");
      finalLabel.textContent = segments[segments.length - 1].end;
      timeLabels.appendChild(finalLabel);
    }
  }

  // FCFS (Non-Preemptive)
  function calculateFCFS() {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const ganttSegments = [];
    processes.forEach((process) => {
      if (currentTime < process.arrivalTime) {
        currentTime = process.arrivalTime;
      }
      const startTime = currentTime;
      currentTime += process.burstTime;
      const finishTime = currentTime;
      process.tat = finishTime - process.arrivalTime;
      process.wt = process.tat - process.burstTime;
      ganttSegments.push({ id: process.id, start: startTime, end: finishTime });
    });
    renderGantt(ganttSegments);
    const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
    const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
    avgTAT.textContent = (totalTAT / processes.length).toFixed(2);
    avgWT.textContent = (totalWT / processes.length).toFixed(2);
    renderTable();
  }

  // SJF (Non-Preemptive)
  function calculateSJF() {
    const n = processes.length;
    let completed = 0;
    let currentTime = 0;
    const ganttSegments = [];
    processes.forEach(p => p.completed = false);
    while (completed < n) {
      const available = processes.filter(p => !p.completed && p.arrivalTime <= currentTime);
      if (available.length === 0) {
        currentTime++;
        continue;
      }
      available.sort((a, b) => a.burstTime - b.burstTime);
      const proc = available[0];
      const start = currentTime;
      const finish = currentTime + proc.burstTime;
      proc.tat = finish - proc.arrivalTime;
      proc.wt = proc.tat - proc.burstTime;
      proc.completed = true;
      completed++;
      currentTime = finish;
      ganttSegments.push({ id: proc.id, start: start, end: finish });
    }
    renderGantt(ganttSegments);
    const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
    const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
    avgTAT.textContent = (totalTAT / n).toFixed(2);
    avgWT.textContent = (totalWT / n).toFixed(2);
    renderTable();
  }

  function calculateSRTF() {
const n = processes.length;
let completed = 0;
let currentTime = 0;
let currentProcess = null;
let segmentStart = 0;
const ganttSegments = [];

// Initialize remaining time for each process
processes.forEach(p => {
    p.remainingTime = p.burstTime;
    p.completed = false;
});

while (completed < n) {
    // Get processes that have arrived and are not completed
    let available = processes.filter(p => p.arrivalTime <= currentTime && !p.completed);

    if (available.length === 0) {
        // If no process is available, jump to the next process arrival
        let nextArrival = Math.min(...processes.filter(p => !p.completed).map(p => p.arrivalTime));
        if (currentProcess !== "idle") {
            if (currentProcess !== null) {
                ganttSegments.push({ id: currentProcess.id, start: segmentStart, end: currentTime });
            }
            currentProcess = "idle";
            segmentStart = currentTime;
        }
        currentTime = nextArrival;
        continue;
    }

    // Select process with the shortest remaining time
    let proc = available.reduce((min, p) => p.remainingTime < min.remainingTime ? p : min, available[0]);

    // If process changes, update Gantt chart
    if (currentProcess !== proc) {
        if (currentProcess !== null && currentProcess !== "idle") {
            ganttSegments.push({ id: currentProcess.id, start: segmentStart, end: currentTime });
        }
        currentProcess = proc;
        segmentStart = currentTime;
    }

    // Execute process for 1 time unit
    proc.remainingTime--;
    currentTime++;

    // If process completes, update details
    if (proc.remainingTime === 0) {
        proc.completed = true;
        proc.finishTime = currentTime;
        proc.tat = proc.finishTime - proc.arrivalTime;
        proc.wt = proc.tat - proc.burstTime;
        completed++;
    }
}

// Final update for the last process in the Gantt chart
if (currentProcess !== null && currentProcess !== "idle") {
    ganttSegments.push({ id: currentProcess.id, start: segmentStart, end: currentTime });
}

// Render Gantt chart
renderGantt(ganttSegments);

// Calculate and display averages
const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
avgTAT.textContent = (totalTAT / n).toFixed(2);
avgWT.textContent = (totalWT / n).toFixed(2);

// Render process table
renderTable();
}
  function calculateRR(quantum) {
const n = processes.length;
let currentTime = 0;
const ganttSegments = [];

// Sort processes by arrival time
processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

// Initialize process attributes
processes.forEach(p => {
    p.remainingTime = p.burstTime;
    p.completed = false;
});

let queue = [];
let i = 0;

// Enqueue all processes that have arrived at time 0
while (i < n && processes[i].arrivalTime <= currentTime) {
    queue.push(processes[i]);
    i++;
}

while (queue.length > 0) {
    const proc = queue.shift();

    // If CPU is idle, move to the next process arrival time
    if (currentTime < proc.arrivalTime) {
        currentTime = proc.arrivalTime;
    }

    // Execute the process for the time quantum or remaining time
    const execTime = Math.min(quantum, proc.remainingTime);
    ganttSegments.push({ id: proc.id, start: currentTime, end: currentTime + execTime });
    currentTime += execTime;
    proc.remainingTime -= execTime;

    // Enqueue new processes that have arrived during execution
    while (i < n && processes[i].arrivalTime <= currentTime) {
        queue.push(processes[i]);
        i++;
    }

    // If process is not completed, re-add it to the queue
    if (proc.remainingTime > 0) {
        queue.push(proc);
    } else {
        proc.completed = true;
        proc.finishTime = currentTime;
        proc.tat = proc.finishTime - proc.arrivalTime;
        proc.wt = proc.tat - proc.burstTime;
    }

    // If the queue is empty but more processes exist, move to the next arrival
    if (queue.length === 0 && i < n) {
        currentTime = processes[i].arrivalTime;
        queue.push(processes[i]);
        i++;
    }
}

// Render Gantt chart
renderGantt(ganttSegments);

// Calculate and display averages
const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
avgTAT.textContent = (totalTAT / n).toFixed(2);
avgWT.textContent = (totalWT / n).toFixed(2);

// Render process table
renderTable();
}

});
