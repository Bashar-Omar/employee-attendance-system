export function calculateLateMinutes(
  checkInUtc: Date,
  shiftStartTime: string, // "09:00"
  gracePeriodMins: number
): number {
  const egyptTime = new Date(checkInUtc).toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [checkInH, checkInM] = egyptTime.split(':').map(Number);
  const [shiftH, shiftM] = shiftStartTime.split(':').map(Number);
  
  const diff = (checkInH * 60 + checkInM) - (shiftH * 60 + shiftM);
  return diff <= gracePeriodMins ? 0 : diff;
}

export function calculateOvertimeMinutes(
  checkOutUtc: Date,
  shiftEndTime: string, // "17:00"
  overtimeAfterMins: number
): number {
  const egyptTime = new Date(checkOutUtc).toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [outH, outM] = egyptTime.split(':').map(Number);
  const [shiftH, shiftM] = shiftEndTime.split(':').map(Number);
  
  const diff = (outH * 60 + outM) - (shiftH * 60 + shiftM);
  return diff <= overtimeAfterMins ? 0 : diff;
}
