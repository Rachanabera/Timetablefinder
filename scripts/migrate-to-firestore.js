const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');


const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function migrate() {
    console.log('🚀 Starting Migration to Firestore...');

    // 1. Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 2. Read local data
    const jsonPath = path.join(process.cwd(), 'data', 'timetable.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ Local timetable.json not found!');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📦 Found ${data.length} records locally.`);

    // 3. Upload to Firestore
    const docRef = doc(db, 'timetable_data', 'master');
    const totalFaculties = new Set(data.map(e => e.Faculty_Code)).size;

    try {
        await setDoc(docRef, {
            entries: data,
            updatedAt: new Date().toISOString(),
            facultyCount: totalFaculties
        });
        console.log('✅ Successfully uploaded data to Firestore!');
        console.log(`📊 Total Faculties: ${totalFaculties}`);
        console.log(`📊 Total Slots: ${data.length}`);
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }

    process.exit(0);
}

migrate();
