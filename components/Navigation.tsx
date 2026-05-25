'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-bold text-xl">
            BNI Gold Members
          </Link>

          <div className="hidden md:flex space-x-4">
            <Link href="/" className="hover:bg-blue-800 px-3 py-2 rounded">
              Home
            </Link>
            <Link href="/members" className="hover:bg-blue-800 px-3 py-2 rounded">
              Members
            </Link>
            <Link href="/recommendations" className="hover:bg-blue-800 px-3 py-2 rounded">
              Recommendations
            </Link>
            <Link href="/domains" className="hover:bg-blue-800 px-3 py-2 rounded">
              Domains
            </Link>
            <Link href="/admin" className="hover:bg-blue-800 px-3 py-2 rounded">
              Admin
            </Link>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            ☰
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block hover:bg-blue-800 px-3 py-2 rounded">
              Home
            </Link>
            <Link href="/members" className="block hover:bg-blue-800 px-3 py-2 rounded">
              Members
            </Link>
            <Link href="/recommendations" className="block hover:bg-blue-800 px-3 py-2 rounded">
              Recommendations
            </Link>
            <Link href="/domains" className="block hover:bg-blue-800 px-3 py-2 rounded">
              Domains
            </Link>
            <Link href="/admin" className="block hover:bg-blue-800 px-3 py-2 rounded">
              Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
