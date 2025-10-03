# Faculty Timetable System 🎓

A modern, real-time faculty timetable management system built with Next.js 14, TypeScript, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8)

## ✨ Features

### 🏫 Room Query
- Search for any room to see which faculty is currently teaching
- Real-time updates based on system time
- Shows course details, faculty info, and schedule
- Auto-complete for all available rooms

### 👥 Free Faculties
- View all faculties who are currently available (not teaching)
- Live statistics showing busy vs. free faculty count
- Auto-refreshes every minute
- Beautiful gradient cards with faculty information

### 📅 Faculty Schedule
- View any faculty's complete schedule for today
- Timeline view with current class highlighted
- Search by faculty code or name
- Chronologically sorted schedule display

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Extract the project files to a folder**

2. **Install dependencies:**
```bash
npm install
```

3. **Add your timetable data:**
   - Place your `timetable.csv` file in the `public/` directory
   - The CSV should have these columns:
     - Faculty_Name
     - Faculty_Code
     - Day (MON, TUE, WED, THR, FRI)
     - Time_Slot (e.g., "9:00-10:00")
     - Course
     - Room

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
faculty-timetable/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── room/
│   │   └── page.tsx            # Room query feature
│   ├── free-faculties/
│   │   └── page.tsx            # Free faculties feature
│   ├── faculty-schedule/
│   │   └── page.tsx            # Faculty schedule feature
│   └── api/
│       └── timetable/
│           └── route.ts        # API endpoint
├── components/
│   ├── Header.tsx              # Navigation header
│   └── ScheduleCard.tsx        # Schedule display card
├── lib/
│   ├── timetable.ts            # Core logic
│   └── utils.ts                # Utilities
├── public/
│   └── timetable.csv           # Your data (add this)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 🎨 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Fonts:** Inter (Google Fonts)

## 🔧 Configuration

### Tailwind Theme
The project uses custom gradients and animations defined in `tailwind.config.js`:
- Custom fade-in and slide-up animations
- Gradient color schemes
- Responsive breakpoints

### API Route
The `/api/timetable` endpoint serves the CSV data as JSON:
- Parses CSV file from `public/timetable.csv`
- Handles quoted fields properly
- Returns array of timetable entries

## 📱 Responsive Design

The UI is fully responsive and works on:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)

## ⚡ Performance

- **Client-side routing** for instant page transitions
- **Auto-refresh** on Free Faculties page (every 60 seconds)
- **Optimized bundle** with Next.js 14
- **Type-safe** with TypeScript

## 🎯 Key Features

1. ✅ Real-time system time detection
2. ✅ Auto-complete search suggestions
3. ✅ Beautiful gradient designs
4. ✅ Smooth animations and transitions
5. ✅ Loading states for all operations
6. ✅ Error handling
7. ✅ Timeline view for schedules
8. ✅ Live clock in header
9. ✅ Statistics dashboard
10. ✅ Color-coded badges

## 🔍 Usage Examples

### Search for a Room
1. Go to "Room Query"
2. Enter room number (e.g., "518A")
3. See who's teaching right now

### Find Free Faculties
1. Go to "Free Faculties"
2. View all available faculty members
3. Auto-updates every minute

### View Faculty Schedule
1. Go to "Faculty Schedule"
2. Enter faculty code (e.g., "AVV")
3. See today's complete schedule

## 📄 License

This project is for educational purposes.

## 🤝 Support

For issues or questions, please check the documentation or create an issue.
or contact me at pathakanuj2004@gmail.com

---
