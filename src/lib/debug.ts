// Debug tools on the phone are opt-in through the URL: ?debug=1
export function isDebugEnabled(): boolean {
  return new URLSearchParams(window.location.search).get('debug') === '1'
}
