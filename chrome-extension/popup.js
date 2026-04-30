// Breakly Chrome Extension - Full Featured Popup

// ============ CONSTANTS ============
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const INTERVAL_PRESETS = [30, 60, 120];
const CARD_COLORS = ['var(--card-pink)', 'var(--card-peach)', 'var(--card-mint)', 'var(--card-lavender)'];

const PRESETS = [
  { title: 'Stretch', icon: '🧘', interval: 60 },
  { title: 'Drink Water', icon: '💧', interval: 60 },
  { title: 'Walk', icon: '🚶', interval: 60 },
  { title: 'Eye Break', icon: '👁️', interval: 20 },
  { title: 'Posture Check', icon: '🧍', interval: 45 },
  { title: 'Deep Breath', icon: '🌬️', interval: 30 }
];

const ACHIEVEMENTS = [
  { id: 'first_day', name: 'First Day', desc: '1+ day streak', icon: '⭐', check: (p) => p.currentStreak >= 1 },
  { id: '3_day', name: '3-Day Streak', desc: '3 consecutive days', icon: '🌟', check: (p) => p.currentStreak >= 3 },
  { id: 'week_warrior', name: 'Week Warrior', desc: '7+ day streak', icon: '🏆', check: (p) => p.currentStreak >= 7 },
  { id: '10_sessions', name: '10 Sessions', desc: 'Complete 10 sessions', icon: '💪', check: (p) => p.totalSessions >= 10 },
  { id: 'monthly_master', name: 'Monthly Master', desc: '30+ day streak', icon: '👑', check: (p) => p.longestStreak >= 30 }
];

const DEFAULT_SETTINGS = {
  defaultIntervalMinutes: 30,
  notificationsEnabled: true,
  defaultSchedule: { activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startHour: 8, endHour: 17 }
};

// ============ STATE ============
let reminders = [];
let settings = { ...DEFAULT_SETTINGS };
let progress = { entries: [], currentStreak: 0, longestStreak: 0, totalSessions: 0, totalMinutes: 0 };
let editingReminderId = null;
let clockInterval = null;
let countdownInterval = null;

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupClock();
  setupTabs();
  setupEventListeners();
});

function loadState() {
  chrome.storage.local.get(['reminders', 'settings', 'progress'], (result) => {
    reminders = result.reminders || [];
    settings = result.settings || { ...DEFAULT_SETTINGS };
    progress = result.progress || { entries: [], currentStreak: 0, longestStreak: 0, totalSessions: 0, totalMinutes: 0 };
    calculateStreak();
    renderAll();
  });
}

function saveState() {
  chrome.storage.local.set({ reminders, settings, progress }, () => {
    chrome.runtime.sendMessage({ type: 'SYNC_ALARMS', reminders });
  });
}

// ============ CLOCK & COUNTDOWN ============
function setupClock() {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
  countdownInterval = setInterval(updateCountdown, 1000);
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  document.getElementById('clock').textContent = `${h12}:${mins}:${secs} ${ampm}`;

  // Greeting
  let greeting = 'Good Evening';
  if (hours < 12) greeting = 'Good Morning';
  else if (hours < 17) greeting = 'Good Afternoon';
  document.getElementById('greeting-text').textContent = greeting;

  // Date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date-text').textContent = now.toLocaleDateString('en-US', options);
}

function updateCountdown() {
  const activeReminders = reminders.filter(r => r.isActive);
  if (activeReminders.length === 0) {
    document.getElementById('next-countdown').textContent = '--:--';
    return;
  }

  // Check if any active reminder is currently within its schedule
  const scheduledReminders = activeReminders.filter(r => isWithinSchedule(r.schedule));
  if (scheduledReminders.length === 0) {
    document.getElementById('next-countdown').textContent = 'Paused';
    return;
  }

  // Find shortest interval for next fire estimation
  const minInterval = Math.min(...scheduledReminders.map(r => r.intervalMinutes));
  const now = new Date();
  const elapsed = now.getMinutes() % minInterval;
  const remaining = minInterval - elapsed;
  const remMins = remaining - 1;
  const remSecs = 60 - now.getSeconds();
  if (remMins > 0) {
    document.getElementById('next-countdown').textContent = `${remMins}m ${String(remSecs).padStart(2, '0')}s`;
  } else {
    document.getElementById('next-countdown').textContent = `${remSecs}s`;
  }
}

function isWithinSchedule(schedule) {
  if (!schedule) return true;
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun, 1=Mon...6=Sat
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const dayName = DAYS[dayIndex];
  const hour = now.getHours();

  if (!schedule.activeDays.includes(dayName)) return false;
  if (hour < schedule.startHour || hour >= schedule.endHour) return false;
  return true;
}

// ============ TABS ============
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  document.querySelectorAll('.sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`subtab-${btn.dataset.subtab}`).classList.add('active');
    });
  });
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  // FAB
  document.getElementById('fab-add').addEventListener('click', () => openModal(null));

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);

  // Form save
  document.getElementById('form-save').addEventListener('click', saveReminder);

  // Form delete
  document.getElementById('form-delete').addEventListener('click', () => {
    if (editingReminderId && confirm('Delete this reminder?')) {
      reminders = reminders.filter(r => r.id !== editingReminderId);
      saveState();
      closeModal();
      renderAll();
    }
  });

  // Settings: notifications toggle
  document.getElementById('notifications-toggle').addEventListener('click', function () {
    settings.notificationsEnabled = !settings.notificationsEnabled;
    this.classList.toggle('active', settings.notificationsEnabled);
    saveState();
  });

  // Settings: reset all
  document.getElementById('reset-all-btn').addEventListener('click', () => {
    if (confirm('Reset all reminders? This cannot be undone.')) {
      reminders = [];
      saveState();
      renderAll();
    }
  });

  // Settings: time steppers
  setupTimeStepper('start-hour-up', 'start-hour-down', 'start-hour-display', 'startHour', 'settings');
  setupTimeStepper('end-hour-up', 'end-hour-down', 'end-hour-display', 'endHour', 'settings');
  setupTimeStepper('form-start-up', 'form-start-down', 'form-start-display', 'startHour', 'form');
  setupTimeStepper('form-end-up', 'form-end-down', 'form-end-display', 'endHour', 'form');

  // Day shortcuts
  document.querySelectorAll('.shortcut-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.days;
      const dayEls = document.querySelectorAll('#form-days .day-chip');
      if (type === 'weekdays') {
        dayEls.forEach((el, i) => el.classList.toggle('active', i < 5));
      } else if (type === 'weekends') {
        dayEls.forEach((el, i) => el.classList.toggle('active', i >= 5));
      } else {
        dayEls.forEach(el => el.classList.add('active'));
      }
    });
  });
}

function setupTimeStepper(upId, downId, displayId, field, context) {
  document.getElementById(upId).addEventListener('click', () => {
    if (context === 'settings') {
      settings.defaultSchedule[field] = Math.min(23, settings.defaultSchedule[field] + 1);
      document.getElementById(displayId).textContent = formatHour(settings.defaultSchedule[field]);
      saveState();
    } else {
      let val = parseInt(document.getElementById(displayId).dataset.value || '8');
      val = Math.min(23, val + 1);
      document.getElementById(displayId).dataset.value = val;
      document.getElementById(displayId).textContent = formatHour(val);
    }
  });
  document.getElementById(downId).addEventListener('click', () => {
    if (context === 'settings') {
      settings.defaultSchedule[field] = Math.max(0, settings.defaultSchedule[field] - 1);
      document.getElementById(displayId).textContent = formatHour(settings.defaultSchedule[field]);
      saveState();
    } else {
      let val = parseInt(document.getElementById(displayId).dataset.value || '8');
      val = Math.max(0, val - 1);
      document.getElementById(displayId).dataset.value = val;
      document.getElementById(displayId).textContent = formatHour(val);
    }
  });
}

// ============ RENDER ALL ============
function renderAll() {
  renderQuickChips();
  renderRemindersGrid();
  renderStatsBanner();
  renderSettings();
  renderProgress();
}

// ============ QUICK CHIPS ============
function renderQuickChips() {
  const container = document.getElementById('quick-chips');
  container.innerHTML = PRESETS.map(preset => {
    const exists = reminders.some(r => r.title === preset.title);
    return `<button class="quick-chip ${exists ? 'disabled' : ''}" data-title="${preset.title}" data-icon="${preset.icon}" data-interval="${preset.interval}">
      ${preset.icon} ${preset.title} ${exists ? '<span class="check">✓</span>' : ''}
    </button>`;
  }).join('');

  container.querySelectorAll('.quick-chip:not(.disabled)').forEach(chip => {
    chip.addEventListener('click', () => {
      addQuickReminder(chip.dataset.title, chip.dataset.icon, parseInt(chip.dataset.interval));
    });
  });
}

function addQuickReminder(title, icon, interval) {
  const reminder = createReminder(title, icon, interval);
  reminders.push(reminder);
  saveState();
  renderAll();
}

// ============ REMINDERS GRID ============
function renderRemindersGrid() {
  const container = document.getElementById('reminders-grid');
  if (reminders.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">＋</div><p>Create your first routine</p></div>`;
    return;
  }

  container.innerHTML = reminders.map((r, i) => {
    const color = CARD_COLORS[i % CARD_COLORS.length];
    const withinSchedule = isWithinSchedule(r.schedule);
    let statusClass, statusText;
    if (!r.isActive) {
      statusClass = 'paused';
      statusText = 'Paused';
    } else if (!withinSchedule) {
      statusClass = 'outside';
      statusText = 'Outside hours';
    } else {
      statusClass = 'active';
      statusText = 'Active';
    }
    return `<div class="reminder-card" style="background: ${color}">
      <div class="reminder-card-header">
        <div class="reminder-card-icon">${r.icon}</div>
        <button class="reminder-card-toggle ${r.isActive ? 'active' : 'inactive'}" data-id="${r.id}"></button>
      </div>
      <div class="reminder-card-title">${r.title}</div>
      <div class="reminder-card-interval">${formatInterval(r.intervalMinutes)}</div>
      <div class="reminder-card-footer">
        <div class="reminder-card-status">
          <span class="status-dot ${statusClass}"></span>
          ${statusText}
        </div>
        <div class="reminder-card-actions">
          <button class="reminder-card-edit" data-id="${r.id}" title="Edit">✏️</button>
          <button class="reminder-card-delete" data-id="${r.id}">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Events
  container.querySelectorAll('.reminder-card-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleReminder(btn.dataset.id);
    });
  });

  container.querySelectorAll('.reminder-card-edit').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(el.dataset.id);
    });
  });

  container.querySelectorAll('.reminder-card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${reminders.find(r => r.id === btn.dataset.id)?.title}"?`)) {
        reminders = reminders.filter(r => r.id !== btn.dataset.id);
        saveState();
        renderAll();
      }
    });
  });
}

function toggleReminder(id) {
  const r = reminders.find(r => r.id === id);
  if (r) {
    r.isActive = !r.isActive;
    saveState();
    renderAll();
  }
}

// ============ STATS BANNER ============
function renderStatsBanner() {
  const activeAndScheduled = reminders.filter(r => r.isActive && isWithinSchedule(r.schedule)).length;
  const totalActive = reminders.filter(r => r.isActive).length;

  if (activeAndScheduled === 0 && totalActive > 0) {
    document.getElementById('active-count').textContent = `0/${totalActive}`;
  } else {
    document.getElementById('active-count').textContent = activeAndScheduled;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = progress.entries.find(e => e.date === today);
  document.getElementById('alerts-sent').textContent = todayEntry ? todayEntry.sessions : 0;

  updateCountdown();
}

// ============ SETTINGS RENDER ============
function renderSettings() {
  // Notifications toggle
  const toggle = document.getElementById('notifications-toggle');
  toggle.classList.toggle('active', settings.notificationsEnabled);

  // Interval chips
  renderChipRow('interval-chips', INTERVAL_PRESETS, settings.defaultIntervalMinutes, (val) => {
    settings.defaultIntervalMinutes = val;
    saveState();
    renderSettings();
  }, formatInterval);

  // Default days
  renderDaysRow('default-days', settings.defaultSchedule.activeDays, (days) => {
    settings.defaultSchedule.activeDays = days;
    saveState();
  });

  // Time displays
  document.getElementById('start-hour-display').textContent = formatHour(settings.defaultSchedule.startHour);
  document.getElementById('end-hour-display').textContent = formatHour(settings.defaultSchedule.endHour);
}

function renderChipRow(containerId, options, activeValue, onChange, formatter) {
  const container = document.getElementById(containerId);
  container.innerHTML = options.map(val => {
    return `<button class="chip ${val === activeValue ? 'active' : ''}" data-value="${val}">${formatter(val)}</button>`;
  }).join('');
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => onChange(parseInt(chip.dataset.value)));
  });
}

function renderDaysRow(containerId, activeDays, onChange) {
  const container = document.getElementById(containerId);
  container.innerHTML = DAYS.map((day, i) => {
    const isActive = activeDays.includes(day);
    return `<button class="day-chip ${isActive ? 'active' : ''}" data-day="${day}">${DAY_LABELS[i]}</button>`;
  }).join('');
  container.querySelectorAll('.day-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const newDays = [];
      container.querySelectorAll('.day-chip.active').forEach(c => newDays.push(c.dataset.day));
      if (newDays.length > 0) onChange(newDays);
      else chip.classList.add('active'); // require at least 1
    });
  });
}

// ============ PROGRESS ============
function calculateStreak() {
  const entries = progress.entries || [];
  if (entries.length === 0) {
    progress.currentStreak = 0;
    progress.longestStreak = 0;
    return;
  }

  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  // Check if today has entry
  const todayStr = today.toISOString().split('T')[0];
  const hasTodayEntry = entries.some(e => e.date === todayStr);
  if (!hasTodayEntry) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (entries.some(e => e.date === dateStr && e.completedCount > 0)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  progress.currentStreak = streak;
  progress.longestStreak = Math.max(progress.longestStreak, streak);

  // Total sessions and minutes
  progress.totalSessions = entries.reduce((sum, e) => sum + e.sessions, 0);
  progress.totalMinutes = entries.reduce((sum, e) => sum + e.totalMinutes, 0);
}

function renderProgress() {
  // Streak
  document.getElementById('streak-count').textContent = progress.currentStreak;
  let msg = 'Start your streak today!';
  if (progress.currentStreak >= 7) msg = "You're unstoppable!";
  else if (progress.currentStreak >= 3) msg = 'Great momentum! Keep going!';
  else if (progress.currentStreak >= 1) msg = "Keep it up! You're on fire!";
  document.getElementById('streak-message').textContent = msg;

  // Today stats
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = progress.entries.find(e => e.date === today) || { sessions: 0, completedCount: 0, totalMinutes: 0 };
  document.getElementById('today-sessions').textContent = todayEntry.sessions;
  document.getElementById('today-completed').textContent = todayEntry.completedCount;

  // This week
  const weekEntries = getEntriesForPeriod(7);
  document.getElementById('week-sessions').textContent = weekEntries.reduce((s, e) => s + e.sessions, 0);
  document.getElementById('week-breaks').textContent = weekEntries.reduce((s, e) => s + e.completedCount, 0);
  document.getElementById('week-minutes').textContent = weekEntries.reduce((s, e) => s + e.totalMinutes, 0);

  // This month
  const monthEntries = getEntriesForMonth();
  document.getElementById('month-sessions').textContent = monthEntries.reduce((s, e) => s + e.sessions, 0);
  document.getElementById('month-breaks').textContent = monthEntries.reduce((s, e) => s + e.completedCount, 0);
  document.getElementById('month-minutes').textContent = monthEntries.reduce((s, e) => s + e.totalMinutes, 0);

  // Achievements
  renderAchievements();

  // Charts
  renderWeeklyChart();

  // Personal best
  document.getElementById('best-streak').textContent = progress.longestStreak;
  document.getElementById('all-sessions').textContent = progress.totalSessions;
  document.getElementById('all-minutes').textContent = progress.totalMinutes;
}

function getEntriesForPeriod(days) {
  const entries = progress.entries || [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return entries.filter(e => e.date >= cutoffStr);
}

function getEntriesForMonth() {
  const entries = progress.entries || [];
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  return entries.filter(e => e.date >= monthStart);
}

function renderAchievements() {
  const container = document.getElementById('achievements-grid');
  container.innerHTML = ACHIEVEMENTS.map(a => {
    const earned = a.check(progress);
    return `<div class="achievement-card ${earned ? 'earned' : ''}">
      <span class="achievement-badge">${earned ? a.icon : '⬜'}</span>
      <div class="achievement-info">
        <span class="achievement-name">${a.name}</span>
        <span class="achievement-desc">${a.desc}</span>
      </div>
    </div>`;
  }).join('');
}

function renderWeeklyChart() {
  const container = document.getElementById('weekly-chart');
  const entries = progress.entries || [];
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = entries.find(e => e.date === dateStr);
    days.push({
      label: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
      value: entry ? entry.completedCount : 0
    });
  }

  const maxVal = Math.max(1, ...days.map(d => d.value));

  container.innerHTML = days.map(d => {
    const height = Math.max(4, (d.value / maxVal) * 70);
    const filled = d.value > 0 ? 'filled' : '';
    return `<div class="chart-bar-wrapper">
      <div class="chart-bar ${filled}" style="height: ${height}px"></div>
      <span class="chart-label">${d.label}</span>
    </div>`;
  }).join('');
}

// ============ MODAL (ADD/EDIT) ============
function openModal(reminderId) {
  editingReminderId = reminderId;
  const modal = document.getElementById('add-edit-modal');
  modal.classList.remove('hidden');

  const isEdit = !!reminderId;
  const reminder = isEdit ? reminders.find(r => r.id === reminderId) : null;

  document.getElementById('modal-title').textContent = isEdit ? 'Edit Reminder' : 'Add Reminder';
  document.getElementById('modal-presets').classList.toggle('hidden', isEdit);
  document.getElementById('form-save').textContent = isEdit ? 'Update Reminder' : 'Create Reminder';
  document.getElementById('form-delete').classList.toggle('hidden', !isEdit);
  document.getElementById('custom-form-title').textContent = isEdit ? 'Edit Details' : 'Custom Reminder';

  // Fill form
  const title = reminder ? reminder.title : '';
  const icon = reminder ? reminder.icon : '🧘';
  const interval = reminder ? reminder.intervalMinutes : settings.defaultIntervalMinutes;
  const schedule = reminder ? reminder.schedule : { ...settings.defaultSchedule };

  document.getElementById('form-title').value = title;

  // Icon picker
  renderIconPicker(icon);

  // Interval chips + custom input
  renderFormIntervalChips(interval);

  // Days
  renderDaysRow('form-days', schedule.activeDays, () => {});

  // Hours
  document.getElementById('form-start-display').textContent = formatHour(schedule.startHour);
  document.getElementById('form-start-display').dataset.value = schedule.startHour;
  document.getElementById('form-end-display').textContent = formatHour(schedule.endHour);
  document.getElementById('form-end-display').dataset.value = schedule.endHour;

  // Presets grid
  if (!isEdit) renderModalPresets();
}

function closeModal() {
  document.getElementById('add-edit-modal').classList.add('hidden');
  editingReminderId = null;
}

function renderIconPicker(activeIcon) {
  const icons = PRESETS.map(p => p.icon);
  const container = document.getElementById('icon-picker');
  container.innerHTML = icons.map(icon => {
    return `<button class="icon-option ${icon === activeIcon ? 'active' : ''}" data-icon="${icon}">${icon}</button>`;
  }).join('');
  container.querySelectorAll('.icon-option').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function renderFormIntervalChips(activeInterval) {
  const container = document.getElementById('form-interval-chips');
  const isCustom = !INTERVAL_PRESETS.includes(activeInterval);
  container.innerHTML = INTERVAL_PRESETS.map(val => {
    return `<button class="chip ${val === activeInterval ? 'active' : ''}" data-value="${val}">${formatInterval(val)}</button>`;
  }).join('') + `<button class="chip ${isCustom ? 'active' : ''}" data-value="custom">Custom</button>
  <div class="custom-interval-row ${isCustom ? '' : 'hidden'}" id="custom-interval-row">
    <div class="custom-interval-input">
      <input type="number" id="form-custom-hours" min="0" max="23" value="${Math.floor((isCustom ? activeInterval : 0) / 60)}" placeholder="0" />
      <span>hr</span>
      <input type="number" id="form-custom-mins" min="0" max="59" value="${(isCustom ? activeInterval : 0) % 60}" placeholder="0" />
      <span>min</span>
    </div>
  </div>`;

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const customRow = document.getElementById('custom-interval-row');
      if (chip.dataset.value === 'custom') {
        customRow.classList.remove('hidden');
      } else {
        customRow.classList.add('hidden');
      }
    });
  });
}

function renderModalPresets() {
  const container = document.getElementById('modal-preset-grid');
  container.innerHTML = PRESETS.map(p => {
    return `<div class="preset-card" data-title="${p.title}" data-icon="${p.icon}" data-interval="${p.interval}">
      <div class="preset-card-icon">${p.icon}</div>
      <div class="preset-card-title">${p.title}</div>
      <div class="preset-card-interval">Every ${formatInterval(p.interval)}</div>
    </div>`;
  }).join('');
  container.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      const r = createReminder(card.dataset.title, card.dataset.icon, parseInt(card.dataset.interval));
      reminders.push(r);
      saveState();
      closeModal();
      renderAll();
    });
  });
}

function saveReminder() {
  const title = document.getElementById('form-title').value.trim();
  if (!title) {
    alert('Please enter an activity name.');
    return;
  }

  const activeIcon = document.querySelector('#icon-picker .icon-option.active');
  const icon = activeIcon ? activeIcon.dataset.icon : '⏰';

  const activeInterval = document.querySelector('#form-interval-chips .chip.active');
  let interval = settings.defaultIntervalMinutes;
  if (activeInterval) {
    if (activeInterval.dataset.value === 'custom') {
      const hours = parseInt(document.getElementById('form-custom-hours').value) || 0;
      const mins = parseInt(document.getElementById('form-custom-mins').value) || 0;
      interval = hours * 60 + mins;
    } else {
      interval = parseInt(activeInterval.dataset.value);
    }
  }

  if (interval < 1) {
    alert('Interval must be at least 1 minute.');
    return;
  }

  const activeDays = [];
  document.querySelectorAll('#form-days .day-chip.active').forEach(c => activeDays.push(c.dataset.day));
  if (activeDays.length === 0) {
    alert('Please select at least one active day.');
    return;
  }

  const startHour = parseInt(document.getElementById('form-start-display').dataset.value || '8');
  const endHour = parseInt(document.getElementById('form-end-display').dataset.value || '17');

  if (editingReminderId) {
    const r = reminders.find(r => r.id === editingReminderId);
    if (r) {
      r.title = title;
      r.icon = icon;
      r.intervalMinutes = interval;
      r.schedule = { activeDays, startHour, endHour };
    }
  } else {
    const r = createReminder(title, icon, interval);
    r.schedule = { activeDays, startHour, endHour };
    reminders.push(r);
  }

  saveState();
  closeModal();
  renderAll();
}

// ============ HELPERS ============
function createReminder(title, icon, intervalMinutes) {
  return {
    id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    icon,
    intervalMinutes,
    isActive: true,
    schedule: { ...settings.defaultSchedule },
    createdAt: new Date().toISOString()
  };
}

function formatInterval(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? '1 hour' : `${h}h`;
  return `${h}h ${m}m`;
}

function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
