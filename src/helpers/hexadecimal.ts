export default class Hexadecimal {
  /**
   * @description Formats a hexadecimal string into a hex dump.
   * @param {string} hash - The hexadecimal string to format.
   * @returns {string | false} The formatted hex dump, or false if an error occurred.
   */
  public static hexDump(hash: string): string | false {
    try {
      const buffer: Uint8Array = new Uint8Array(hash.match(/[\da-f]{2}/gi)!.map((hex: string) => parseInt(hex, 16)))
      const formattedHex: string[] = []

      for (let i = 0; i < buffer.length; i += 16) {
        const chunk: Uint8Array = buffer.slice(i, i + 16)
        const hexString: string = Array.from(chunk, (byte: number) => byte.toString(16).padStart(2, '0')).join(' ')
        const printableChars: string = Array.from(chunk, (byte: number) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.')).join('')
        const line: string = `${i.toString(16).padStart(4, '0')}: ${hexString.padEnd(48)}  ${printableChars}\n`
        formattedHex.push(line)
      }
      return formattedHex.join('')
    } catch (_error) {
      return false
    }
  }

  /**
   * @description Reverses a hex dump into a single hexadecimal string.
   * @param {string} dump - The hex dump to reverse.
   * @returns {string | false} The reversed hexadecimal string, or false if an error occurred.
   */
  public static reverseHexDump(dump: string): string | false {
    try {
      const lines: string[] = dump.split('\n').filter(Boolean) as string[]
      const separateValues = (str: string): string => str.match(/[\da-f]{2}/gi)!.join(' ')
      const hex: string = lines
        .map((line: string): string => {
          const parts: string[] = line.split(':') as string[]
          const hexValue: string = parts[1].trim()
          const index: number = hexValue.indexOf('  ')
          const valueToProcess: string = index !== -1 ? hexValue.slice(0, index) : hexValue

          return separateValues(valueToProcess)
        })
        .join('')
        .replace(/\s/g, '')

      return hex
    } catch (_error) {
      return false
    }
  }

  /**
   * @description Generates an array of random bytes.
   * @param {number} size - The size of the array.
   * @returns {Uint8Array} - The array of random bytes.
   */
  public static randomBytes(size: number): Uint8Array {
    const array: Uint8Array = new Uint8Array(size)
    crypto.getRandomValues(array)
    return array
  }

  /**
   * @description Generates a random hexadecimal string of the specified size.
   * @param {number} size - The size of the hexadecimal string.
   * @returns {string} - The randomly generated hexadecimal string.
   */
  public static randomHex(size: number): string {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }

  /**
   * @description Converts a hexadecimal string into an array of bytes.
   * @param {string} hex - The hexadecimal string to convert.
   * @returns {number[]} An array of bytes.
   */
  public static hexToBytes(hex: string): number[] {
    const bytes: number[] = []
    for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substring(i, i + 2), 16) as number)
    return bytes
  }

  /**
   * @description Converts an array of bytes into a hexadecimal string.
   * @param {Uint8Array} array - The array of bytes to convert.
   * @returns {string} The hexadecimal string.
   */
  public static uint8ArrayToHex(array: Uint8Array): string {
    return Array.from(array)
      .map((byte: number): string => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * @description Converts a hexadecimal string into an Uint8Array of bytes.
   * @param {string} hex - The hexadecimal string to convert.
   * @returns {Uint8Array} - The Uint8Array of bytes.
   */
  public static hexToUint8Array(hex: string): Uint8Array {
    return new Uint8Array(this.hexToBytes(hex))
  }
}
