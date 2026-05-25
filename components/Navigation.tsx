'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white text-gray-900 shadow-md border-b-4 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-red-600 font-black text-3xl tracking-tight">BNI</span>
            <span className="text-gray-400 text-2xl font-light">|</span>
            <span className="text-gray-700 font-semibold text-sm">Gold Members Romania</span>
          </Link>

          <div className="hidden md:flex space-x-1">
            <Link href="/" className="hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded font-medium text-sm uppercase tracking-wide">
              Acasa
            </Link>
            <Link href="/members" className="hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded font-medium text-sm uppercase tracking-wide">
              Membri
            </Link>
            <Link href="/recommendations" className="hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded font-medium text-sm uppercase tracking-wide">
              Recomandari
            </Link>
            <Link href="/domains" className="hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded font-medium text-sm uppercase tracking-wide">
              Domenii
            </Link>
            <Link href="/admin" className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded font-medium text-sm uppercase tracking-wide">
              Admin
            </Link>
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-1">
            <Link href="/" className="block hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded">
              Acasa
            </Link>
            <Link href="/members" className="block hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded">
              Membri
            </Link>
            <Link href="/recommendations" className="block hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded">
              Recomandari
            </Link>
            <Link href="/domains" className="block hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded">
              Domenii
            </Link>
            <Link href="/admin" className="block bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded">
              Admin
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
