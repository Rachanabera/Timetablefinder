"use client"

import Link from 'next/link'
import { Calendar, Home, Users, DoorOpen, MapPin, User, Sparkles, Clock } from 'lucide-react'

export default function Header() {
  const navItems = [
    { href: '/', label: 'Home', icon: Home, color: 'text-blue-600' },
    { href: '/faculty-schedule', label: 'Faculty Schedule', icon: Calendar, color: 'text-orange-600' },
    { href: '/room', label: 'Room Query', icon: DoorOpen, color: 'text-blue-600' },
    { href: '/free-faculties', label: 'Free Faculties', icon: Users, color: 'text-purple-600' },
    { href: '/room-availability', label: 'Room Availability', icon: MapPin, color: 'text-green-600' },
    { href: '/faculty-availability', label: 'Faculty Availability', icon: User, color: 'text-purple-600' },
    { href: '/all-faculties', label: 'All Faculties', icon: Users, color: 'text-orange-600' },
    { href: '/timetable-generator', label: 'Generator', icon: Sparkles, color: 'text-indigo-600' }
  ]

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Timetable System</h1>
              <p className="text-xs text-gray-600">College Management</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">
                {currentTime}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="lg:hidden mt-4 grid grid-cols-2 gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
