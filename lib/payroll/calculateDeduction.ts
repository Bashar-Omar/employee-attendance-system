import type { DeductionRule } from '@prisma/client';

export function findApplicableRule(
  lateMinutes: number,
  isAbsent: boolean,
  rules: DeductionRule[]
): DeductionRule | null {
  const matches = rules.filter((r) => {
    if (isAbsent) return r.type === 'ABSENT';
    if (r.type !== 'LATE') return false;
    
    // For LATE rules
    if (lateMinutes < r.lateMinutesFrom) return false;
    if (r.lateMinutesTo !== null && lateMinutes > r.lateMinutesTo) return false;
    return true;
  });
  
  if (matches.length === 0) return null;
  
  // If multiple rules match, use the most specific (highest lower bound)
  return matches.sort((a, b) => b.lateMinutesFrom - a.lateMinutesFrom)[0];
}

export function calculateDailyDeductionAmount(
  rule: DeductionRule,
  monthlySalary: number,
  workingDaysInMonth: number
): number {
  if (rule.deductionType === 'FIXED_AMOUNT') {
    return rule.deductionValue;
  }
  
  // PERCENTAGE type
  const dailySalary = workingDaysInMonth > 0 ? monthlySalary / workingDaysInMonth : 0;
  return (dailySalary * rule.deductionValue) / 100;
}
