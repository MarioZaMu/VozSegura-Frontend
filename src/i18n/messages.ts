import { en } from './en'
import { es } from './es'

/** Every language has the same texts as Spanish (es.ts is the reference). */
export type Messages = typeof es

export const messages = { es, en }
