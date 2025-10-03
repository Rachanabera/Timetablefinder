"use client"

import Link from 'next/link'
import { GraduationCap, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Header() {
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Faculty Timetable</h1>
              <p className="text-xs text-gray-500">Real-time Schedule System</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/room"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Room Query
            </Link>
            <Link
              href="/free-faculties"
              className="text-gray-600 hover:text-purple-600 font-medium transition-colors"
            >
              Free Faculties
            </Link>
            <Link
              href="/faculty-schedule"
              className="text-gray-600 hover:text-pink-600 font-medium transition-colors"
            >
              Faculty Schedule
            </Link>
          </nav>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>
    </header>
  )
}