import path from 'path'
import Aes256 from 'helpers/aes256'
import Hexadecimal from 'helpers/hexadecimal'

import { Buffer } from 'buffer'
import { Readable } from 'stream'
import { existsSync, writeFileSync } from 'fs'
import { Nvll, s3Client, kmsClient } from 'environment'
import { createDecipheriv, type CipherKey } from 'crypto'
import { DecryptCommand, type DecryptCommandOutput } from '@aws-sdk/client-kms'
import { ListObjectsV2Command, GetObjectCommand, type ListObjectsV2CommandInput } from '@aws-sdk/client-s3'
import { chalk_error } from './chalks'

/**
 * Convert a readable stream into a Buffer.
 *
 * @param {NodeJSReadableStream} stream - The stream to convert.
 * @returns {Promise<Buffer>} - A Promise that resolves to the converted Buffer.
 */
const streamToBuffer = (stream: NodeJSReadableStream): Promise<Buffer> =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })

/**
 * Decrypts a symmetric encrypted data using AES-256-GCM algorithm.
 *
 * @param {Buffer} key - The symmetric key used for decryption (Buffer).
 * @param {Buffer} encryptedData - The encrypted data to decrypt (Buffer).
 * @param {Buffer} iv - The initialization vector used for decryption (Buffer).
 * @param {Buffer} authTag - The authentication tag used for decryption (Buffer).
 * @param {number} originalSize - The original size of the decrypted data (number).
 * @return {Promise<Buffer>} - The decrypted data (Promise<Buffer>).
 */
const symmetric = async (key: CipherKey, encryptedData: Buffer, iv: Buffer, authTag: Buffer, originalSize: number): Promise<Buffer> => {
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const decryptedChunks = await streamToBuffer(Readable.from(encryptedData).pipe(decipher))
  return decryptedChunks.subarray(0, originalSize)
}

/**
 * Decrypts and saves an S3 email.
 *
 * @param {string} objectKey - The S3 object key of the email to decrypt.
 * @returns {Promise<{ filename: string } | undefined>} - The filename of the decrypted email, or undefined if decryption or saving fails.
 */
const decryptAndSaveEmail = async (objectKey: string): Promise<{ filename: string } | undefined> => {
  const filename = Nvll.env.LOCAL_MAILBOX_DIRECTORY
    ? path.join(Nvll.env.LOCAL_MAILBOX_DIRECTORY, `${objectKey.replace(`${Nvll.env.PREFIX}/`, '')}.eml`)
    : undefined

  if (filename && existsSync(filename)) {
    console.error(chalk_error(' Already exists locally, skipping decryption.'))
    return { filename }
  }

  try {
    const { Body, Metadata } = await s3Client.send(new GetObjectCommand({ Bucket: Nvll.env.BUCKET_NAME, Key: objectKey }))
    const metadata = Metadata as unknown as S3ObjectMetadata
    const {
      'x-amz-key-v2': envelopeKey,
      'x-amz-iv': envelopeIv,
      'x-amz-unencrypted-content-length': originalSizeStr,
      'x-amz-matdesc': contextStr
    } = metadata

    const context = JSON.parse(contextStr)
    const envelopeKeyBuffer = Buffer.from(envelopeKey, 'base64')
    const envelopeIvBuffer = Buffer.from(envelopeIv, 'base64')
    const originalSize = parseInt(originalSizeStr, 10)

    const decryptCommand = new DecryptCommand({ CiphertextBlob: envelopeKeyBuffer, EncryptionContext: context })
    const decryptResult: DecryptCommandOutput = await kmsClient.send(decryptCommand)

    const bodyBuffer = await streamToBuffer(Body as NodeJSReadableStream)
    const authTag = bodyBuffer.subarray(bodyBuffer.length - 16)
    const encryptedData = bodyBuffer.subarray(0, bodyBuffer.length - 16)
    const decryptedData = await symmetric(decryptResult.Plaintext as CipherKey, encryptedData, envelopeIvBuffer, authTag, originalSize)

    if (filename) {
      if (Nvll.env.LOCAL_DEFAULT_ENCRYPTION && Nvll.env.LOCAL_DEFAULT_ENCRYPTION_TYPE && Nvll.env.LOCAL_DEFAULT_ENCRYPTION_KEY) {
        const key: Uint8Array = Hexadecimal.hexToUint8Array(Nvll.env.LOCAL_DEFAULT_ENCRYPTION_KEY as string)
        const localEncrypted: string = await Aes256.encrypt(decryptedData.toString(), key, Nvll.env.LOCAL_DEFAULT_ENCRYPTION_TYPE)
        const mailHexDump: string | boolean = Hexadecimal.hexDump(localEncrypted)

        writeFileSync(filename, mailHexDump as string, 'utf8')
      } else {
        writeFileSync(filename, decryptedData, 'utf8')
      }
      return { filename }
    }
  } catch (error: any) {
    console.error(chalk_error(`Error decrypting or saving object ${objectKey}: ${error.message}`))
  }
}

/**
 * Retrieves the list of encrypted emails from S3.
 *
 * @returns {Promise<{ Key: string; LastModified: Date }[]>} - The list of encrypted emails.
 */
const s3EncryptedEmails = async (): Promise<{ Key: string; LastModified: Date | undefined }[]> => {
  let continuationToken: string | undefined

  const objects: { Key: string; LastModified: Date | undefined }[] = []
  const params: ListObjectsV2CommandInput = { Bucket: Nvll.env.BUCKET_NAME, Prefix: Nvll.env.PREFIX, ContinuationToken: continuationToken }

  try {
    do {
      const { Contents, NextContinuationToken } = await s3Client.send(new ListObjectsV2Command(params))
      if (Contents) {
        objects.push(
          ...Contents.map(({ Key, LastModified }) => ({
            Key: Key as string,
            LastModified: LastModified ? new Date(LastModified.getTime()) : undefined
          }))
        )
      }
      continuationToken = NextContinuationToken
    } while (continuationToken)
  } catch (error: any) {
    console.error(chalk_error(`Error listing emails: ${error.message}`))
  }
  return objects.sort((a, b) => {
    const aLastModifiedTime = (a.LastModified ?? new Date(0)).getTime()
    const bLastModifiedTime = (b.LastModified ?? new Date(0)).getTime()
    return bLastModifiedTime - aLastModifiedTime
  })
}

export { decryptAndSaveEmail, s3EncryptedEmails }
