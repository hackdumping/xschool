/**
 * Dynamically calculates the current academic year based on the current date.
 * The academic year transitions on September 1st.
 * Example: 
 *   - On Aug 31, 2026 -> 2025/2026
 *   - On Sep 1, 2026 -> 2026/2027
 */
export const getCurrentAcademicYear = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = January)

  // September is month 8
  if (month >= 8) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

/**
 * Returns the "next" academic year relative to the current one.
 */
export const getNextAcademicYear = (currentYear?: string): string => {
  const ay = currentYear || getCurrentAcademicYear();
  const parts = ay.split('/');
  if (parts.length === 2) {
    const startYear = parseInt(parts[0]);
    return `${startYear + 1}/${startYear + 2}`;
  }
  
  // Fallback for hyphenated format if still present
  const hyphenParts = ay.split('-');
  if (hyphenParts.length === 2) {
    const startYear = parseInt(hyphenParts[0]);
    return `${startYear + 1}/${startYear + 2}`;
  }

  return ay; // Fallback
};
