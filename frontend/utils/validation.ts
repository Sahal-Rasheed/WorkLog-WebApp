import type { ValidationResult } from '../types';

export function validateTimeEntry(entry: {
  date: string;
  task: string;
  hours: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate date
  if (!entry.date) {
    errors.push('Date is required');
  } else {
    const date = new Date(entry.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  // Validate task
  if (!entry.task || entry.task.trim().length === 0) {
    errors.push('Task description is required');
  }

  // Validate hours
  if (entry.hours <= 0) {
    errors.push('Hours must be greater than 0');
  } else if (entry.hours > 24) {
    errors.push('Hours cannot exceed 24');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateOrganizationName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Organization name is required');
  } else if (name.trim().length < 2) {
    errors.push('Organization name must be at least 2 characters');
  } else if (name.trim().length > 50) {
    errors.push('Organization name must be less than 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
