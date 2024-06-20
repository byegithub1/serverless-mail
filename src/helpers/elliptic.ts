import elliptic, { ec } from 'elliptic'

const curve25519 = new elliptic.ec('curve25519')

/**
 * @description Generates a random shared key using the elliptic curve 25519 algorithm.
 * @returns {string} The generated shared key.
 */
const randomSharedKey = (): string => {
  let keyAB: string, keyBA: string

  do {
    const keyA = curve25519.genKeyPair() as ec.KeyPair
    const keyB = curve25519.genKeyPair() as ec.KeyPair

    keyAB = keyA.derive(keyB.getPublic()).toString('hex')
    keyBA = keyB.derive(keyA.getPublic()).toString('hex')
  } while (keyAB !== keyBA)

  return keyAB
}

/**
 * @description Generates an array of random shared keys using the elliptic curve 25519 algorithm.
 * @param {number} count - The number of keys to generate.
 * @returns {string[]} An array of generated shared keys.
 */
const randomSharedKeys = (count: number): string[] => {
  const randomKeys: string[] = []

  for (let i = 0; i < count; i++) randomKeys.push(randomSharedKey())
  return randomKeys
}

export { randomSharedKey, randomSharedKeys }
