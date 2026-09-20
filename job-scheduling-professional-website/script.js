const state = {
  jobs: [],
  scheduled: [],
  rejected: [],
  slots: [],
  totalProfit: 0
};

const $ = (id) => document.getElementById(id);

const elements = {
  jobName: $("jobName"),
  deadline: $("deadline"),
  profit: $("profit"),
  jobList: $("jobList"),
  timeline: $("timeline"),
  totalProfit: $("totalProfit"),
  jobCount: $("jobCount"),
  scheduledCount: $("scheduledCount"),
  executionText: $("executionText"),
  executionLog: $("executionLog")
};

function addJob() {
  const name = elements.jobName.value.trim();
  const deadline = Number(elements.deadline.value);
  const profit = Number(elements.profit.value);

  if (!name || !Number.isInteger(deadline) || deadline < 1 ||
      !Number.isFinite(profit) || profit < 0) {
    alert("Please enter a valid job name, deadline and profit.");
    return;
  }

  if (state.jobs.some(job => job.name.toLowerCase() === name.toLowerCase())) {
    alert("A job with this name already exists.");
    return;
  }

  state.jobs.push({ name, deadline, profit });

  clearInputs();
  renderJobs();
  clearResult();
}

function clearInputs() {
  elements.jobName.value = "";
  elements.deadline.value = "";
  elements.profit.value = "";
  elements.jobName.focus();
}

function loadExample() {
  state.jobs = [
    { name: "J1", deadline: 2, profit: 100 },
    { name: "J2", deadline: 1, profit: 19 },
    { name: "J3", deadline: 2, profit: 27 },
    { name: "J4", deadline: 1, profit: 25 },
    { name: "J5", deadline: 3, profit: 15 }
  ];

  renderJobs();
  clearResult();
  elements.executionText.textContent =
    "Example loaded. Run the algorithm to visualize each decision.";
}

function resetAll() {
  state.jobs = [];
  state.scheduled = [];
  state.rejected = [];
  state.slots = [];
  state.totalProfit = 0;

  renderJobs();
  renderTimeline();
  updateSummary();

  elements.executionText.textContent = "Waiting for input...";
  elements.executionLog.innerHTML = `
    <div class="log-title">Execution Log</div>
    <p>Add jobs and run the algorithm to see each scheduling decision.</p>
  `;

  setStep(1);
}

function clearResult() {
  state.scheduled = [];
  state.rejected = [];
  state.slots = [];
  state.totalProfit = 0;

  renderTimeline();
  updateSummary();

  elements.executionText.textContent =
    "Jobs ready. Press Run Algorithm.";
  setStep(1);
}

function renderJobs() {
  elements.jobList.innerHTML = "";

  if (state.jobs.length === 0) {
    elements.jobList.innerHTML = `
      <div class="empty-message">
        No jobs added yet.
      </div>
    `;
    updateSummary();
    return;
  }

  state.jobs.forEach(job => {
    const card = document.createElement("div");
    card.className = "job-card";

    const selected = state.scheduled.some(j => j.name === job.name);
    const rejected = state.rejected.some(j => j.name === job.name);

    if (selected) card.classList.add("scheduled");
    if (rejected) card.classList.add("rejected");

    card.innerHTML = `
      <div class="job-name">${escapeHTML(job.name)}</div>
      <small>Deadline: ${job.deadline}</small>
      <small>Profit: ${job.profit}</small>
    `;

    elements.jobList.appendChild(card);
  });

  updateSummary();
}

function runAlgorithm() {
  if (state.jobs.length === 0) {
    alert("Add at least one job first.");
    return;
  }

  const sorted = [...state.jobs].sort((a, b) => {
    if (b.profit !== a.profit) return b.profit - a.profit;
    return a.deadline - b.deadline;
  });

  const maxDeadline = Math.max(...state.jobs.map(job => job.deadline));

  state.slots = new Array(maxDeadline).fill(null);
  state.scheduled = [];
  state.rejected = [];
  state.totalProfit = 0;

  setStep(1);
  elements.executionText.textContent =
    "Jobs have been sorted in decreasing order of profit.";

  const logLines = [
    `<b>Sorted order:</b> ${sorted.map(j => `${j.name} (${j.profit})`).join(" → ")}`
  ];

  sorted.forEach(job => {
    let placed = false;
    let selectedSlot = -1;

    for (let i = Math.min(job.deadline, maxDeadline) - 1; i >= 0; i--) {
      if (state.slots[i] === null) {
        state.slots[i] = job;
        selectedSlot = i + 1;
        placed = true;
        break;
      }
    }

    if (placed) {
      state.scheduled.push(job);
      state.totalProfit += job.profit;

      logLines.push(
        `✓ <b>${job.name}</b> → placed in slot ${selectedSlot} (deadline ${job.deadline}, profit ${job.profit}).`
      );
    } else {
      state.rejected.push(job);

      logLines.push(
        `× <b>${job.name}</b> → skipped because no slot was available before deadline ${job.deadline}.`
      );
    }
  });

  setStep(2);
  renderJobs();
  renderTimeline();
  updateSummary();

  setTimeout(() => setStep(3), 250);

  elements.executionText.textContent =
    `Completed. ${state.scheduled.length} of ${state.jobs.length} jobs were scheduled.`;

  elements.executionLog.innerHTML = `
    <div class="log-title">Execution Log</div>
    ${logLines.map(line => `<p>${line}</p>`).join("")}
    <p style="margin-top:10px;color:#86efac;">
      <b>Maximum Total Profit: ${state.totalProfit}</b>
    </p>
  `;
}

function renderTimeline() {
  elements.timeline.innerHTML = "";

  if (state.slots.length === 0) {
    elements.timeline.innerHTML = `
      <div class="slot">
        <small>TIME SLOT</small>
        <strong>—</strong>
        <span>Run algorithm</span>
      </div>
    `;
    return;
  }

  state.slots.forEach((job, index) => {
    const slot = document.createElement("div");
    slot.className = "slot";

    if (job) {
      slot.classList.add("filled");
      slot.innerHTML = `
        <small>SLOT ${index + 1}</small>
        <strong>${escapeHTML(job.name)}</strong>
        <span>Profit ${job.profit}</span>
      `;
    } else {
      slot.innerHTML = `
        <small>SLOT ${index + 1}</small>
        <strong>Empty</strong>
        <span>Available</span>
      `;
    }

    elements.timeline.appendChild(slot);
  });
}

function updateSummary() {
  elements.jobCount.textContent = state.jobs.length;
  elements.scheduledCount.textContent = state.scheduled.length;
  elements.totalProfit.textContent = state.totalProfit;
}

function setStep(number) {
  [1, 2, 3].forEach(i => {
    const step = $(`step${i}`);
    if (step) step.classList.toggle("active", i <= number);
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

$("addBtn").addEventListener("click", addJob);
$("exampleBtn").addEventListener("click", loadExample);
$("resetBtn").addEventListener("click", resetAll);
$("runBtn").addEventListener("click", runAlgorithm);

[elements.jobName, elements.deadline, elements.profit].forEach(input => {
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") addJob();
  });
});

loadExample();
runAlgorithm();
