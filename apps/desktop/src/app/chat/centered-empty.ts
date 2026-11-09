/**
 * Whether the composer dock renders in its centered empty state.
 *
 * A fresh chat (no messages yet) centers the prompt bar with its hero —
 * the Codex/OpenClaw new-chat layout — and the first send docks it at the
 * bottom of the surface. Anything that means the conversation is already
 * underway (or not actually on screen yet) keeps the dock at the bottom:
 * busy (a send is in flight, so it must slide down at once), a session
 * still loading, the resume-exhausted error, and the guided setup chat
 * whose own intro overlay owns the empty surface.
 */
export function shouldCenterComposer(input: {
  busy: boolean
  loadingSession: boolean
  messagesEmpty: boolean
  resumeExhausted: boolean
  setupChat: boolean
  showChatBar: boolean
}): boolean {
  return (
    input.showChatBar && input.messagesEmpty && !input.loadingSession && !input.busy && !input.resumeExhausted && !input.setupChat
  )
}
