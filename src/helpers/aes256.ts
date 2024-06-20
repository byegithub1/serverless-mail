import crypto from 'crypto'
import Hexadecimal from 'helpers/hexadecimal'

import { Nvll } from 'environment'

export default class Aes256 {
  private static encoder: TextEncoder = new TextEncoder()
  private static decoder: TextDecoder = new TextDecoder()
  private static delimiter: string = Nvll.env.CIPHER_DELIMITER || 'f1f69ebc4e564c4c2d454e56454c4f5045bc9ef6f1'

  /**
   * @description Imports a raw key into a CryptoKey.
   * @param {Uint8Array} key - The raw key to import.
   * @param {AesAlgorithmParams} algorithm - The algorithm parameters.
   * @return {Promise<CryptoKey>} The imported CryptoKey.
   */
  private static async setKey(key: Uint8Array, algorithm: AesAlgorithmParams): Promise<CryptoKey> {
    return (await crypto.subtle.importKey('raw', key, { name: algorithm.name }, false, ['encrypt', 'decrypt'])) as CryptoKey
  }

  /**
   * @description Encrypts a message using the specified algorithm.
   * @param {string} message - The message to encrypt.
   * @param {Uint8Array} key - The encryption key.
   * @param {AesAlgorithmParams} algorithmType - The algorithm to use for encryption.
   * @returns {Promise<string>} The encrypted message, formatted according to the algorithm type.
   */
  public static async encrypt(message: string, key: Uint8Array, algorithmType: 'AES-GCM' | 'AES-CTR' | 'AES-CBC'): Promise<string> {
    const encodedMessage: Uint8Array = this.encoder.encode(message)
    let algorithm: AesAlgorithmParams
    let iv: Uint8Array | undefined
    let counter: Uint8Array | undefined

    switch (algorithmType) {
      case 'AES-GCM': {
        iv = crypto.getRandomValues(new Uint8Array(12))
        algorithm = { name: 'AES-GCM', iv }
        break
      }
      case 'AES-CTR': {
        counter = crypto.getRandomValues(new Uint8Array(16))
        algorithm = { name: 'AES-CTR', counter, length: 64 }
        break
      }
      case 'AES-CBC': {
        iv = crypto.getRandomValues(new Uint8Array(16))
        algorithm = { name: 'AES-CBC', iv }
        break
      }
      default:
        throw new Error('Unsupported algorithm.')
    }

    const cryptoKey: CryptoKey = await this.setKey(key, algorithm)
    const encrypted: ArrayBuffer = await crypto.subtle.encrypt(algorithm, cryptoKey, encodedMessage)

    if (algorithmType === 'AES-GCM') {
      const tag: string = Hexadecimal.uint8ArrayToHex(new Uint8Array(encrypted.slice(-16)))
      const ciphertext: string = Hexadecimal.uint8ArrayToHex(new Uint8Array(encrypted.slice(0, -16)))

      return `${ciphertext}${this.delimiter}${Hexadecimal.uint8ArrayToHex(iv!)}${this.delimiter}${tag}`
    } else {
      const cipherHex: string = Hexadecimal.uint8ArrayToHex(new Uint8Array(encrypted))
      const counterHex: string = Hexadecimal.uint8ArrayToHex(algorithmType === 'AES-CTR' ? counter! : iv!)
      return `${cipherHex}${this.delimiter}${counterHex}`
    }
  }

  /**
   * @description Decrypts a cipher text using the specified algorithm.
   * @param {string} cipher - The cipher text to decrypt.
   * @param {Uint8Array} key - The decryption key.
   * @param {('AES-GCM' | 'AES-CTR' | 'AES-CBC')} algorithmType - The algorithm to use for decryption.
   * @returns {Promise<string>} The decrypted message.
   */
  public static async decrypt(cipher: string, key: Uint8Array, algorithmType: 'AES-GCM' | 'AES-CTR' | 'AES-CBC'): Promise<string> {
    const parts: string[] = cipher.split(this.delimiter)
    let algorithm: AesAlgorithmParams
    let cryptoKey: CryptoKey
    let decrypted: ArrayBuffer

    switch (algorithmType) {
      case 'AES-GCM': {
        if (parts.length !== 3) throw new Error('Invalid cipher text format.')

        const [ciphertextHexGcm, ivHexGcm, tagHexGcm]: string[] = parts
        const ciphertextGcm: Uint8Array = Hexadecimal.hexToUint8Array(ciphertextHexGcm)
        const ivGcm: Uint8Array = Hexadecimal.hexToUint8Array(ivHexGcm)
        const tagGcm: Uint8Array = Hexadecimal.hexToUint8Array(tagHexGcm)

        algorithm = { name: 'AES-GCM', iv: ivGcm }
        cryptoKey = await this.setKey(key, algorithm)
        const cipherDataGcm: Uint8Array = new Uint8Array([...ciphertextGcm, ...tagGcm])
        decrypted = await crypto.subtle.decrypt(algorithm, cryptoKey, cipherDataGcm)
        break
      }
      case 'AES-CTR': {
        if (parts.length !== 2) throw new Error('Invalid cipher text format.')

        const [ciphertextHexCtr, counterHexCtr]: string[] = parts
        const ciphertextCtr: Uint8Array = Hexadecimal.hexToUint8Array(ciphertextHexCtr)
        const counterCtr: Uint8Array = Hexadecimal.hexToUint8Array(counterHexCtr)

        algorithm = { name: 'AES-CTR', counter: counterCtr, length: 64 }
        cryptoKey = await this.setKey(key, algorithm)
        decrypted = await crypto.subtle.decrypt(algorithm, cryptoKey, ciphertextCtr)
        break
      }
      case 'AES-CBC': {
        if (parts.length !== 2) throw new Error('Invalid cipher text format.')

        const [ciphertextHexCbc, ivHexCbc]: string[] = parts
        const ciphertextCbc: Uint8Array = Hexadecimal.hexToUint8Array(ciphertextHexCbc)
        const ivCbc: Uint8Array = Hexadecimal.hexToUint8Array(ivHexCbc)

        algorithm = { name: 'AES-CBC', iv: ivCbc }
        cryptoKey = await this.setKey(key, algorithm)
        decrypted = await crypto.subtle.decrypt(algorithm, cryptoKey, ciphertextCbc)
        break
      }
      default:
        throw new Error('Unsupported algorithm.')
    }

    return this.decoder.decode(decrypted)
  }
}
