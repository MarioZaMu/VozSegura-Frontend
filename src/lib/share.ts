import { Share } from '@capacitor/share'
import { isNativeApp } from './platform'

export type ShareResult = 'shared' | 'copied' | 'failed'

/**
 * Opens the system share sheet (native app or Web Share API); falls back to copying the
 * link when there is none (PC browsers). Cancelling the sheet counts as 'failed'.
 */
export async function shareLink({ title, text, url }: { title: string; text: string; url: string }): Promise<ShareResult> {
  try {
    if (isNativeApp()) {
      await Share.share({ title, text, url, dialogTitle: title })
      return 'shared'
    }
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
  } catch {
    return 'failed'
  }
  return copyText(url)
}

export async function copyText(text: string): Promise<ShareResult> {
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
