export const metadata = {
  title: 'Planet Motors CMS',
  description: 'Content management for Planet Motors website',
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ margin: 0, padding: 0, height: '100vh' }}>{children}</div>
  )
}
