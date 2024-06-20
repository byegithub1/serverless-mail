declare module 'bun' {
  interface Env {
    APP_NAME: string
    APP_ENV: string
  }
}

type NodeJSReadableStream = NodeJS.ReadableStream

interface Nvll {
  env: NvllEnv
}

interface NvllEnv {
  REGION: string | undefined
  ACCESS_KEY_ID: string | undefined
  SECRET_ACCESS_KEY: string | undefined
  BUCKET_NAME: string | undefined
  PREFIX: string | undefined
  LOCAL_MAILBOX_DIRECTORY: string | undefined
  LOCAL_DEFAULT_ENCRYPTION?: string | undefined
  LOCAL_DEFAULT_ENCRYPTION_TYPE?: 'AES-GCM' | 'AES-CTR' | 'AES-CBC'
  LOCAL_DEFAULT_ENCRYPTION_KEY?: string
  CIPHER_DELIMITER?: string
}

interface AesAlgorithmParams extends Algorithm {
  name: 'AES-GCM' | 'AES-CTR' | 'AES-CBC'
  iv?: Uint8Array
  counter?: Uint8Array
  length?: number
}

interface ConfigChoices {
  name: string
  value: keyof NvllEnv
}

interface S3ObjectMetadata {
  'x-amz-tag-len': string
  'x-amz-unencrypted-content-length': string
  'x-amz-wrap-alg': string
  'x-amz-matdesc': string
  'x-amz-key-v2': string
  'x-amz-cek-alg': string
  'x-amz-iv': string
}

interface EmailData {
  ObjectKey: string
  From?: string
  Received: Date
  Subject: string
  Attachments: Attachment
  Error?: string
}

interface ListedEmailData {
  'S3 Object Key': string
  From: string
  Received: string
  Subject: string
  Attachments: string
}
