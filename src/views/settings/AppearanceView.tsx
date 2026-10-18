import { AppearanceSection } from './AppearanceSection'

// Theme and language on their own page (top bar), so Settings stays focused on the alert.
export function AppearanceView() {
  return (
    <main className="mx-auto flex max-w-content flex-col gap-4 px-gutter pb-section animate-screen-in">
      <AppearanceSection />
    </main>
  )
}
