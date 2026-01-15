/**
 * Capitalizes the first letter of each word in a string
 * Handles special cases like "MT-07", "R1", etc.
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      // Handle empty words
      if (!word) return word;
      
      // Handle words with hyphens (e.g., "MT-07" -> "MT-07")
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('-');
      }
      
      // Handle regular words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
