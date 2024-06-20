import moment from 'moment'

export default class dateFormat {
  /**
   * @description Returns the time in the format HH:mm AM/PM as a string.
   * @param {Date} date - The date object to format.
   * @returns {string} The formatted time string.
   */
  static antePostMeridiem = (date: Date) => {
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${hours}:${minutes} ${ampm}`
  }

  /**
   * @description Returns the date in the format "Day, Month DaySuffix, Year at HH:mm AM/PM" as a string.
   * @param {Date} date - The date object to format.
   * @returns {string} The formatted date string.
   */
  static detailed = (date: Date) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    const dayOfWeek = daysOfWeek[date.getDay()]
    const month = monthsOfYear[date.getMonth()]
    const day = date.getDate()

    const suffixes = ['th', 'st', 'nd', 'rd']
    const relevantDigits = day % 100
    const suffix = suffixes[(relevantDigits - 20) % 10] || suffixes[relevantDigits] || suffixes[0]

    return `${dayOfWeek}, ${month} ${day}${suffix}, ${date.getFullYear()} at ${this.antePostMeridiem(date)}`
  }

  static simple = (date: Date) => moment(date).format('YYYY-MM-DD HH:mm:ss')
}
