"use client"

import { useState, useEffect } from 'react'
import { Users, Search, User, ArrowRight, Loader2, Mail, Phone, BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { TimetableEntry } from '@/lib/timetable'

export default function AllFaculties() {
    const [faculties, setFaculties] = useState<{ name: string; code: string; department?: string; totalClasses: number }[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/timetable')
                const data: TimetableEntry[] = await response.json()

                // Group by faculty code to get unique list and class count
                const facultyMap = new Map<string, { name: string; code: string; count: number }>()

                data.forEach(entry => {
                    if (!facultyMap.has(entry.Faculty_Code)) {
                        facultyMap.set(entry.Faculty_Code, {
                            name: entry.Faculty_Name,
                            code: entry.Faculty_Code,
                            count: 0
                        })
                    }
                    const info = facultyMap.get(entry.Faculty_Code)!
                    info.count++
                })

                const sortedFaculties = Array.from(facultyMap.values())
                    .map(f => ({
                        name: f.name,
                        code: f.code,
                        totalClasses: f.count
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name))

                setFaculties(sortedFaculties)
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredFaculties = faculties.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
                    <Users className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-bold text-gray-800">All Faculties</h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Complete directory of all faculty members in the system.
                    View schedules and availability for everyone.
                </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="relative max-w-2xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search by name or faculty code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-6 py-4 pl-14 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all text-lg shadow-inner"
                    />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />

                    {search && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                            {filteredFaculties.length} found
                        </div>
                    )}
                </div>
            </div>

            {/* Faculty Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    <p className="text-gray-500 font-medium">Loading faculty directory...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredFaculties.map((faculty) => (
                        <div
                            key={faculty.code}
                            className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center space-y-4 relative overflow-hidden"
                        >
                            {/* Accents */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-50 to-red-50 -mr-12 -mt-12 rounded-full transition-transform group-hover:scale-150 duration-500" />

                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white transition-transform group-hover:rotate-6">
                                    {faculty.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Active in system" />
                            </div>

                            {/* Info */}
                            <div className="space-y-1 z-10">
                                <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{faculty.name}</h3>
                                <p className="text-orange-600 font-bold tracking-wider text-sm">{faculty.code}</p>
                            </div>

                            {/* Stats */}
                            <div className="w-full grid grid-cols-1 gap-2 pt-2">
                                <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <BookOpen className="w-4 h-4" />
                                        <span>Total Slots</span>
                                    </div>
                                    <span className="font-bold text-gray-800">{faculty.totalClasses}</span>
                                </div>
                            </div>

                            {/* Action */}
                            <Link
                                href={`/faculty-schedule?code=${faculty.code}`}
                                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-orange-600 hover:text-white transition-all duration-300 group/btn"
                            >
                                View Schedule
                                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredFaculties.length === 0 && (
                <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-3xl p-12 text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-orange-800 mb-2">No results found</h3>
                    <p className="text-orange-600">We couldn't find any faculty matching "{search}"</p>
                    <button
                        onClick={() => setSearch('')}
                        className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-full font-semibold hover:bg-orange-700 transition-colors"
                    >
                        Clear Search
                    </button>
                </div>
            )}
        </div>
    )
}
