/**
 * Calculate age from date of birth
 * @param {string} dob - Date of birth in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export const calculateAgeFromDOB = dob => {
  if (!dob) return ''
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--
  }
  return age
}

/**
 * Calculate date of birth from age
 * @param {number} age - Age in years
 * @returns {string} Date of birth in YYYY-MM-DD format
 */
export const calculateDOBFromAge = age => {
  if (!age) return ''
  const today = new Date()
  const birthYear = today.getFullYear() - age
  const month = today.getMonth() + 1 // months are 0-indexed
  const day = today.getDate()
  // Pad month/day with 0
  const mm = month < 10 ? `0${month}` : month
  const dd = day < 10 ? `0${day}` : day
  return `${birthYear}-${mm}-${dd}`
}
