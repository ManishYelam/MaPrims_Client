// dateFilterUtils.js

/**
 * Applies date filter to an array of items
 * @param {Array} items - Array of items to filter
 * @param {string} dateField - Field name containing the date (e.g., 'createdAt')
 * @param {Object} dateFilter - { filterType: string, value: string }
 * @returns {Array} Filtered array
 */
export const applyDateFilter = (items, dateField, dateFilter) => {
  if (!dateFilter || !dateFilter.filterType) return items

  return items.filter(item => {
    const itemDate = new Date(item[dateField])

    if (dateFilter.filterType === 'specific_date' && dateFilter.value) {
      const specificDate = new Date(dateFilter.value)
      return itemDate.toDateString() === specificDate.toDateString()
    }

    if (dateFilter.filterType === 'date_range' && dateFilter.value) {
      try {
        const [startStr, endStr] = dateFilter.value.split(' to ')
        const startDate = new Date(startStr)
        const endDate = new Date(endStr)
        endDate.setHours(23, 59, 59, 999)
        return itemDate >= startDate && itemDate <= endDate
      } catch (error) {
        return true
      }
    }

    const { start, end } = getDateRange(dateFilter.filterType)
    if (!start || !end) return true

    const startOfDay = new Date(start)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(end)
    endOfDay.setHours(23, 59, 59, 999)

    return itemDate >= startOfDay && itemDate <= endOfDay
  })
}

// Re-export the utility functions from the component
export { getDateRange, formatDateForDisplay } from './DateFilterDropdown'
