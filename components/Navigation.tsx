'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white text-[#1f2326] shadow-sm border-b-4 border-[#c8102e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-[#c8102e] font-black text-3xl tracking-tight">BNI</span>
            <span className="text-[#a7a9ac] text-2xl font-light">|</span>
            <span className="text-[#1f2326] font-bold text-sm">Gold Members Romania</span>
          </Link>

          <div className="hidden md:flex space-x-1">
            <Link href="/" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
              Acasa
            </Link>
            <Link href="/members" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
              Performerii GOLD
            </Link>
            <Link href="/recommendations" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
              Recomandari
            </Link>
            <Link href="/domains" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
              Domenii
            </Link>
            <Link href="/regulament" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
              Regulament
            </Link>
            <Link href="/admin" className="bg-[#c8102e] text-white hover:bg-[#9f1239] px-4 py-2 rounded font-bold text-sm uppercase tracking-wide">
              Login
            </Link>
          </div>

          <button
            className="md:hidden text-[#1f2326]"
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
            <Link href="/" className="block hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-semibold">
              Acasa
            </Link>
            <Link href="/members" className="block hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-semibold">
              Performerii GOLD
            </Link>
            <Link href="/recommendations" className="block hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-semibold">
              Recomandari
            </Link>
            <Link href="/domains" className="block hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-semibold">
              Domenii
            </Link>
            <Link href="/regulament" className="block hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-semibold">
              Regulament
            </Link>
            <Link href="/admin" className="block bg-[#c8102e] text-white hover:bg-[#9f1239] px-3 py-2 rounded font-semibold">
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
