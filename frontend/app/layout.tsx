import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from './providers/Web3Provider'
import { QueryProvider } from './providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'USDC Yield Optimizer',
  description: 'Optimize your USDC yield across Aave, Morpho, and Moonwell on Base',
  keywords: ['DeFi', 'Yield', 'USDC', 'Base', 'Aave', 'Morpho', 'Moonwell'],
  authors: [{ name: 'YO Assignment Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </QueryProvider>
      </body>
    </html>
  )
}