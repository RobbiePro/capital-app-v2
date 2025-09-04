// Add 'limit' to the list of imported tools from Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, where, getDocs, writeBatch, deleteDoc, getDoc, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC8uDv1D4Og-WYKHjbG8o8GrZ461L4VDfQ",
    authDomain: "personal-capital-app.firebaseapp.com",
    projectId: "personal-capital-app",
    storageBucket: "personal-capital-app.appspot.com",
    messagingSenderId: "972117824027",
    appId: "1:972117824027:web:356e13c2a6bc4be5d11ebe"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const investmentsCollection = collection(db, "investments");
const cashMeasurementsCollection = collection(db, "cashMeasurements");
const manualAssetsCollection = collection(db, "manualAssets");
const goalsCollection = collection(db, "goals");
const cashboxCollection = collection(db, 'cashboxTransactions');
const capitalSnapshotsCollection = collection(db, 'capitalSnapshots');

const investmentsQuery = query(collection(db, "investments"), where("status", "==", "open"), orderBy("timestamp", "desc"));

export {
    db,
    investmentsCollection,
    cashMeasurementsCollection,
    manualAssetsCollection,
    goalsCollection,
    cashboxCollection,
    capitalSnapshotsCollection,
    investmentsQuery,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    where,
    getDocs,
    writeBatch,
    collection,
    deleteDoc,
    getDoc,
    limit // <-- The new tool is now on the list!
};