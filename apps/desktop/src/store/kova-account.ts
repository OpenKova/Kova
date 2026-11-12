export const KOVA_ACCOUNT_PROMPT_DISMISSED_KEY = 'kova.account.prompt-dismissed'

export function shouldPromptForKovaAccount(
  status: { configured: boolean; profile: null | { username: null | string } },
  dismissed: boolean
): boolean {
  return status.configured && !status.profile?.username && !dismissed
}
