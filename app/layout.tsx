import './globals.css'

export const metadata = {
  title: 'VieGeo - Nền tảng học Địa lí',
  description: 'Gamification learning platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
