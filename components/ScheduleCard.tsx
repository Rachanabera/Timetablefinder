import { Clock, MapPin, User } from 'lucide-react'
import type { TimetableEntry } from '@/lib/timetable'

interface ScheduleCardProps {
  entry: TimetableEntry
  highlight?: boolean
}

export default function ScheduleCard({ entry, highlight = false }: ScheduleCardProps) {
  return (
    <div className={`rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl card-hover ${
      highlight 
        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
        : 'bg-white'
    }`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className={`text-xl font-bold ${highlight ? 'text-white' : 'text-gray-800'}`}>
              {entry.Course}
            </h3>
            <div className={`flex items-center gap-2 mt-2 ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-medium">{entry.Time_Slot}</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            highlight 
              ? 'bg-white/20 text-white' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {entry.Day}
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-4 pt-4 ${highlight ? 'border-white/20' : 'border-gray-200'} border-t`}>
          <div className="flex items-center gap-2">
            <User className={`w-4 h-4 ${highlight ? 'text-blue-100' : 'text-gray-400'}`} />
            <div>
              <div className={`text-xs ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>Faculty</div>
              <div className={`font-semibold ${highlight ? 'text-white' : 'text-gray-800'}`}>
                {entry.Faculty_Code}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${highlight ? 'text-blue-100' : 'text-gray-400'}`} />
            <div>
              <div className={`text-xs ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>Room</div>
              <div className={`font-semibold ${highlight ? 'text-white' : 'text-gray-800'}`}>
                {entry.Room || 'TBD'}
              </div>
            </div>
          </div>
        </div>

        <div className={`text-sm ${highlight ? 'text-blue-100' : 'text-gray-600'}`}>
          {entry.Faculty_Name}
        </div>
      </div>
    </div>
  )
}