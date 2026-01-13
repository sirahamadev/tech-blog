export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} sirahama. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
