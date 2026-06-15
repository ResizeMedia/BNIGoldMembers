'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

const MYBNI_URL = 'https://mybni.com/launcher'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const loginRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header>
      {/* Top utility bar */}
      <div className="bg-[#c8102e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-10 gap-6 text-sm font-bold">
            <a
              href="https://bni-romania.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/80 hidden sm:inline"
            >
              BNI Romania
            </a>

            <div className="relative" ref={loginRef}>
              <button
                onClick={() => setLoginOpen(!loginOpen)}
                className="flex items-center gap-1.5 hover:text-white/80"
              >
                Login membri
                <svg
                  className={`w-3 h-3 transition-transform ${loginOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {loginOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#c8102e] text-white rounded shadow-lg overflow-hidden z-50">
                  <a
                    href={MYBNI_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setLoginOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold hover:bg-[#9f1239]"
                  >
                    MyBni
                  </a>
                  <Link
                    href="/admin"
                    onClick={() => setLoginOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold hover:bg-[#9f1239] border-t border-white/20"
                  >
                    Acces platforma
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="bg-white text-[#1f2326] shadow-sm border-b-4 border-[#c8102e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-[#c8102e] font-black text-3xl tracking-tight">BNI</span>
            </Link>

            <div className="hidden md:flex space-x-1">
              <Link href="/" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
                Gold club members
              </Link>
              <Link href="/campanie" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
                Campanie &quot;6 to Gold&quot;
              </Link>
              <Link href="/recommendations" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
                Trimite recomandare
              </Link>
              <Link href="/domains" className="hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-bold text-sm uppercase tracking-wide">
                Domenii cautate
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
                Gold club members
              </Link>
              <Link href="/campanie" className="block hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-semibold">
                Campanie &quot;6 to Gold&quot;
              </Link>
              <Link href="/recommendations" className="block hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-semibold">
                Trimite recomandare
              </Link>
              <Link href="/domains" className="block hover:bg-[#fff1f2] hover:text-[#c8102e] px-3 py-2 rounded font-semibold">
                Domenii cautate
              </Link>
              <Link href="/admin" className="block bg-[#c8102e] text-white hover:bg-[#9f1239] px-3 py-2 rounded font-semibold">
                Acces platforma
              </Link>
              <a href={MYBNI_URL} target="_blank" rel="noopener noreferrer" className="block bg-[#1f2326] text-white hover:bg-black px-3 py-2 rounded font-semibold">
                MyBni
              </a>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
