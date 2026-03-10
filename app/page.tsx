"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Users, DoorOpen, Calendar, Loader2, MapPin, Sparkles } from 'lucide-react'
import type { TimetableEntry } from '@/lib/timetable'

export default function Home() {
  const [stats, setStats] = useState({ classes: 0, faculties: 0, rooms: 0 })
  const [loading, setLoading] = useState(true)

  const features = [
    {
      title: 'Room Query',
      description: 'Find which faculty is teaching in a specific room right now',
      icon: DoorOpen,
      href: '/room',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Free Faculties',
      description: 'See which faculties are available at the current time',
      icon: Users,
      href: '/free-faculties',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Faculty Schedule',
      description: "View any faculty's complete schedule for today",
      icon: Calendar,
      href: '/faculty-schedule',
      gradient: 'from-orange-500 to-red-500',
    },
  ]

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/timetable')
        const data: TimetableEntry[] = await response.json()

        const uniqueFaculties = new Set(data.map(e => e.Faculty_Code)).size
        const uniqueRooms = new Set(data.filter(e => e.Room).map(e => e.Room)).size

        setStats({
          classes: data.length,
          faculties: uniqueFaculties,
          rooms: uniqueRooms
        })
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-12 animate-fade-in mb-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-50 opacity-50 skew-y-3 -z-10" />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4" />
          Cloud Powered System
        </div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Faculty Timetable System
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Real-time faculty schedule management with intelligent cloud queries and department merging.
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Clock className="w-5 h-5 text-blue-500" />
          <span className="font-medium">Live updates based on system time</span>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {features.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover border border-gray-100"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="relative space-y-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-2">
                <span className="flex items-center gap-2 text-blue-600 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  Try it out
                  <span className="text-xl">→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Section */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 -mr-32 -mt-32 rounded-full opacity-50" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-5xl font-black text-gray-800">
                {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : stats.classes}
              </div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Class Slots</div>
            </div>

            <div className="text-center space-y-2 md:border-x border-gray-100">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-5xl font-black text-gray-800">
                {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : stats.faculties}
              </div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Faculties</div>
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 text-pink-600 mx-auto mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-5xl font-black text-gray-800">
                {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : stats.rooms}
              </div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Unique Locations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}