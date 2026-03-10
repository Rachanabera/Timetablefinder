"use client"

import { useState } from 'react'
import { Upload, FileType, CheckCircle2, AlertCircle, Loader2, ArrowRight, Download, Table } from 'lucide-react'
import Link from 'next/link'

export default function TimetableGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState<{ facultyCount: number; entryCount: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus('idle')
      setMessage('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setStatus('uploading')
    setMessage('Uploading and parsing file...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/generate-timetable', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Timetable successfully generated and updated!')
        setStats({
          facultyCount: data.facultyCount,
          entryCount: data.entryCount,
        })
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to process the file.')
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      setMessage('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
          <Table className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Timetable Generator</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Upload an Excel (.xlsx) file containing faculty timetables.
          The generator will parse all sheets and update the system database.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 space-y-6">
          {/* Upload Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 text-center ${file
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="space-y-4">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${file ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                {file ? <FileType className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {file ? file.name : 'Click or drag Excel file here'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports .xlsx and .xls formats
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${!file || loading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-95'
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                Generate Timetable
              </>
            )}
          </button>

          {/* Status Messages */}
          {status !== 'idle' && (
            <div className={`p-4 rounded-xl flex items-start gap-3 transition-all animate-slide-in ${status === 'success' ? 'bg-green-50 border border-green-100' :
              status === 'error' ? 'bg-red-50 border border-red-100' :
                'bg-blue-50 border border-blue-100'
              }`}>
              {status === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : status === 'error' ? (
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              ) : (
                <Loader2 className="w-6 h-6 text-blue-500 flex-shrink-0 animate-spin" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${status === 'success' ? 'text-green-800' :
                  status === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                  {message}
                </p>
                {stats && status === 'success' && (
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-2 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-700">{stats.facultyCount}</div>
                      <div className="text-xs text-green-600 uppercase font-bold tracking-wider">Faculty</div>
                    </div>
                    <div className="bg-white/50 p-2 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-700">{stats.entryCount}</div>
                      <div className="text-xs text-green-600 uppercase font-bold tracking-wider">Total Slots</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Auto-Combine
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Lab Merging
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Room Extraction
              </span>
            </div>
            <Link
              href="/faculty-schedule"
              className="text-blue-600 font-bold flex items-center gap-1 hover:underline"
            >
              View Results <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>


    </div>
  )
}
