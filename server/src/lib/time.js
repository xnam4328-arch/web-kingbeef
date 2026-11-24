function timeToMinutes(timeStr) {
  const [h, m] = String(timeStr).split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const clamped = Math.min(totalMinutes, 23 * 60 + 59);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addHoursToTime(startTime, hours = 2) {
  return minutesToTime(timeToMinutes(startTime) + hours * 60);
}

function isTimeOverlapping(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB);
}

function hoursUntilReservation(reservationDate, startTime) {
  const target = new Date(`${reservationDate}T${startTime}:00`);
  const now = new Date();
  return (target.getTime() - now.getTime()) / (1000 * 60 * 60);
}

function generateBookingCode(branchName = '') {
  const prefix = branchName.toLowerCase().includes('tân bình')
    ? 'TB'
    : branchName.toLowerCase().includes('gò vấp')
    ? 'GV'
    : 'KB';
  const now = new Date();
  const ymd = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KB-${prefix}-${ymd}-${rand}`;
}

function formatDateYMD(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = {
  timeToMinutes,
  addHoursToTime,
  isTimeOverlapping,
  hoursUntilReservation,
  generateBookingCode,
  formatDateYMD,
};
