"use client"

import { User, Clock, CheckCircle, XCircle, BookOpen, MapPin } from 'lucide-react'
import type { TimetableEntry } from '@/lib/timetable'

interface FacultyListViewProps {
  freeFaculties: { code: string; name: string }[]
  busyFaculties: TimetableEntry[]
  timeSlot: string
  day: string
}

export default function FacultyListView({
  freeFaculties,
  busyFaculties,
  timeSlot,
  day
}: FacultyListViewProps) {
  const busyMap = new Map<string, TimetableEntry[]>()
  busyFaculties.forEach(entry => {
    const existing = busyMap.get(entry.Faculty_Code) || []
    existing.push(entry)
    busyMap.set(entry.Faculty_Code, existing)
  })

  const busyFacultyList = Array.from(busyMap.entries()).map(([code, classes]) => ({
    code,
    name: classes[0].Faculty_Name,
    classes
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-10 h-10 opacity-80" />
            <div className="text-4xl font-bold">{freeFaculties.length}</div>
          </div>
          <div className="text-emerald-100 font-medium">Free Faculties</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-10 h-10 opacity-80" />
            <div className="text-4xl font-bold">{busyFacultyList.length}</div>
          </div>
          <div className="text-red-100 font-medium">Busy Faculties</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-10 h-10 opacity-80" />
            <div className="text-4xl font-bold">
              {((busyFacultyList.length / (freeFaculties.length + busyFacultyList.length)) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="text-blue-100 font-medium">Utilization</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-l-purple-500">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-purple-600" />
          <div>
            <div className="text-sm text-gray-600">Showing availability for</div>
            <div className="font-bold text-gray-800 text-lg">{day} at {timeSlot}</div>
          </div>
        </div>
      </div>

      {freeFaculties.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Free Faculties ({freeFaculties.length})</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-50 border-b-2 border-green-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faculty Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faculty Code</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {freeFaculties.map((faculty, index) => (
                  <tr
                    key={faculty.code}
                    className="border-b border-gray-100 hover:bg-green-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-600 font-medium">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                          {faculty.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800">{faculty.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">{faculty.code}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Available
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {busyFacultyList.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
            <div className="flex items-center gap-3 text-white">
              <XCircle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Busy Faculties ({busyFacultyList.length})</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-red-50 border-b-2 border-red-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faculty Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faculty Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Course</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {busyFacultyList.map((faculty, index) => (
                  <tr
                    key={faculty.code}
                    className="border-b border-gray-100 hover:bg-red-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-600 font-medium">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold">
                          {faculty.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800">{faculty.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">{faculty.code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-orange-500 flex-shrink-0 mt-1" />
                        <span className="text-gray-700 text-sm line-clamp-2">
                          {faculty.classes?.[0]?.Course}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-gray-800">
                          {faculty.classes?.[0]?.Room || 'TBD'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          In Class
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
