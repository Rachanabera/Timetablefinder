import Link from 'next/link'
import { Clock, Users, DoorOpen, Calendar } from 'lucide-react'

export default function Home() {
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

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Faculty Timetable System
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Real-time faculty schedule management with intelligent queries
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Clock className="w-5 h-5" />
          <span>Live updates based on system time</span>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <Link
            key={index}
            href={feature.href}
            className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 card-hover"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

            <div className="relative space-y-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-800">
                {feature.title}
              </h3>

              <p className="text-gray-600">
                {feature.description}
              </p>

              <div className="pt-4">
                <span className="text-blue-600 font-semibold group-hover:translate-x-2 inline-block transition-transform duration-300">
                  Explore →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="text-4xl font-bold text-blue-600">748</div>
            <div className="text-gray-600 mt-2">Total Classes</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="text-4xl font-bold text-purple-600">42</div>
            <div className="text-gray-600 mt-2">Faculties</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="text-4xl font-bold text-pink-600">100+</div>
            <div className="text-gray-600 mt-2">Rooms</div>
          </div>
        </div>
      </div>
    </div>
  )
}