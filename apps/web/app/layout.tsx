import { Geist, Geist_Mono, Inter } from "next/font/google"

import "@flow/ui/globals.css"
import "@flow/expression-editor/style.css"
import "@flow/flow/style.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@flow/ui/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
