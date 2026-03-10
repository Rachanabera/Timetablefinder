"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";

interface TimetableEntry {
    Faculty_Name: string;
    Faculty_Code: string;
    Day: string;
    Time_Slot: string;
    Course: string;
    Room: string;
}

export default function AdminPage() {
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");

    // Handler for cell edits
    const handleCellChange = (index: number, field: keyof TimetableEntry, value: string) => {
        const updatedEntries = [...entries];
        updatedEntries[index] = { ...updatedEntries[index], [field]: value };
        setEntries(updatedEntries);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        const newEntries: TimetableEntry[] = [];
        setUploadStatus(`Processing ${files.length} file(s)...`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);

            workbook.SheetNames.forEach((sheetName) => {
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

                if (jsonData.length < 10) return;

                // Metadata extraction logic (Shared logic)
                let facultyCode = "";
                let facultyName = "";
                const row6 = jsonData[6] || [];
                const possibleCode = (row6[8] || "").toString().trim();
                const possibleName = (row6[9] || "").toString().trim();

                if (possibleCode.startsWith("/") || possibleCode.length > 0) {
                    facultyCode = possibleCode.replace("/", "").trim();
                }
                if (possibleName.length > 0) facultyName = possibleName;

                if (!facultyName) facultyName = sheetName;
                if (!facultyCode) facultyCode = facultyName.substring(0, 3).toUpperCase();

                if (facultyName === "ABCD" || facultyCode === "XXX" || facultyName.includes("Faculty Name")) return;

                // Header Row for Time Slots (Row 7)
                const row7 = jsonData[7] || [];
                const timeSlotIndices: { [key: number]: string } = {};
                const TIME_SLOT_REGEX = /\d{1,2}:\d{2}\s*to\s*\d{1,2}:\d{2}/i;

                row7.forEach((cell: any, index: number) => {
                    const txt = (cell || "").toString().trim();
                    if (TIME_SLOT_REGEX.test(txt)) {
                        timeSlotIndices[index] = txt.replace(/\s+to\s+/i, "-");
                    }
                });

                if (Object.keys(timeSlotIndices).length === 0) return;

                // Iterate Days (Row 8+)
                for (let r = 8; r < jsonData.length; r++) {
                    const row = jsonData[r] || [];
                    const dayCell = (row[0] || "").toString().toUpperCase().trim();
                    const VALID_DAYS = ["MON", "TUE", "WED", "THR", "FRI", "SAT"];
                    let currentDay = "";

                    if (VALID_DAYS.some(d => dayCell.includes(d))) {
                        currentDay = dayCell.substring(0, 3);
                    }

                    if (!currentDay) continue;

                    Object.keys(timeSlotIndices).forEach((colIndex: any) => {
                        const cellContent = (row[colIndex] || "").toString().trim();
                        if (cellContent) {
                            const parts = cellContent.split(/\r?\n/).map((p: string) => p.trim()).filter((p: string) => p);
                            if (parts.length > 0) {
                                let course = "";
                                let room = "";

                                if (parts.length >= 2) {
                                    room = parts[parts.length - 1];
                                    course = parts.slice(0, parts.length - 1).join(" ");
                                } else {
                                    course = parts[0];
                                }

                                if (!room) {
                                    const roomMatch = course.match(/^(.*)[-\s](\d{3}[A-Za-z]?)$/);
                                    if (roomMatch) {
                                        course = roomMatch[1].trim();
                                        room = roomMatch[2].trim();
                                    }
                                }
                            }

                            const LAB_ROOMS = ["112A", "112C", "213A", "508A", "508B", "513A", "513B", "518A", "518B", "519", "520", "521", "522", "523", "524"];
                            let timeSlot = timeSlotIndices[colIndex];

                            if (LAB_ROOMS.includes(room.toUpperCase())) {
                                // Convert 1 hour slot to 2 hours
                                // Format is usually "2:00-3:00" or "10:00-11:00"
                                const parts = timeSlot.split("-");
                                if (parts.length === 2) {
                                    const startStr = parts[0].trim();
                                    const endStr = parts[1].trim(); // Unused but good for ref

                                    // Parse Start Time
                                    let [startHour, startMin] = startStr.split(":").map(Number);
                                    if (startHour < 7) startHour += 12; // Handle 1:00, 2:00 etc as PM

                                    // Add 2 hours
                                    let endHour = startHour + 2;

                                    // Format back
                                    const formatTime = (h: number, m: number) => {
                                        const suffix = h >= 12 ? "" : ""; // Usually inputs don't have AM/PM, assuming 24h internal or simple 12h
                                        const displayH = h > 12 ? h - 12 : h;
                                        return `${displayH}:${m.toString().padStart(2, '0')}`;
                                    };

                                    // Reconstruct "Start-End"
                                    // We need to match the input format style
                                    // If input was "2:00", we assume "2:00-4:00"
                                    timeSlot = `${parts[0].trim()}-${formatTime(endHour, startMin)}`;
                                }
                            }

                            newEntries.push({
                                Faculty_Name: facultyName,
                                Faculty_Code: facultyCode,
                                Day: currentDay,
                                Time_Slot: timeSlot,
                                Course: course,
                                Room: room,
                            });
                        }
                    }
                    });
        }
    });
}

setEntries((prev) => [...prev, ...newEntries]);
setLoading(false);
setUploadStatus(`Uploaded ${newEntries.length} entries. Total: ${entries.length + newEntries.length}`);
    };

const handleSaveToFirebase = async () => {
    setLoading(true);
    setUploadStatus("Saving to database...");

    try {
        console.log("Starting batch save...");
        // Create a batch
        const batch = writeBatch(db);
        const collectionRef = collection(db, "timetables");

        const CHUNK_SIZE = 450; // Batch limit is 500
        let savedCount = 0;

        if (entries.length === 0) {
            throw new Error("No entries to save!");
        }

        console.log(`Processing ${entries.length} entries...`);

        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
            const chunk = entries.slice(i, i + CHUNK_SIZE);
            const chunkBatch = writeBatch(db);
            chunk.forEach((entry) => {
                const docRef = doc(collectionRef); // Auto-ID
                chunkBatch.set(docRef, entry);
            });
            await chunkBatch.commit();
            savedCount += chunk.length;
            console.log(`Saved chunk ${Math.floor(i / CHUNK_SIZE) + 1}, total: ${savedCount}`);
        }

        setUploadStatus(`Successfully saved ${savedCount} entries to Firebase!`);
        alert("Success! Data saved to Firestore.");
    } catch (error: any) {
        console.error("Error saving to Firebase:", error);
        // Show the actual error message to the user
        setUploadStatus(`Error: ${error.message || "Unknown error"}`);
        alert(`Failed to save: ${error.message}. \n\nCheck if your Firestore Security Rules allow writes (Test Mode).`);
    } finally {
        setLoading(false);
    }
};

return (
    <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Timetables</h2>
            <div className="flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Excel Files</label>
                    <input
                        type="file"
                        multiple
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100"
                    />
                </div>
            </div>
            {uploadStatus && <p className="mt-4 text-sm font-medium text-blue-600">{uploadStatus}</p>}
        </div>

        {entries.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Preview Data ({entries.length})</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setEntries([])}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleSaveToFirebase}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save to Database"}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {entries.map((entry, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <input
                                            value={entry.Faculty_Name}
                                            onChange={(e) => handleCellChange(idx, 'Faculty_Name', e.target.value)}
                                            className="border rounded px-2 py-1 w-full"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.Day}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.Time_Slot}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <input
                                            value={entry.Course}
                                            onChange={(e) => handleCellChange(idx, 'Course', e.target.value)}
                                            className="border rounded px-2 py-1 w-full"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <input
                                            value={entry.Room}
                                            onChange={(e) => handleCellChange(idx, 'Room', e.target.value)}
                                            className="border rounded px-2 py-1 w-20"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
);
}
