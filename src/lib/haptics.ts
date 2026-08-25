/**
 * Lyhyt haptinen napautus kosketuspalautteeksi.
 *
 * HUOM: Vibration API toimii Androidilla (Chrome/Firefox). iOS Safari ei tue sitä
 * lainkaan eikä siihen ole verkkostandardia korviketta — iPhonella palaute jää
 * pelkän painallusskaalauksen varaan. Kutsu on siksi aina turvallinen no-op.
 */
export function tapFeedback(ms = 8): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(ms)
  } catch {
    // Selain voi estää värinän (esim. käyttäjän asetus) — ei kaadeta mitään
  }
}
