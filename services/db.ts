import { MisinformationRecord } from '../types';

const DB_NAME = 'misinformationDB';
const STORE_NAME = 'misinformationLog';
const DB_VERSION = 1;

let db: IDBDatabase;

// Function to open/initialize the database
export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening IndexedDB.');
        };

        request.onsuccess = (event) => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Use 'domain' as the key path for efficient lookups
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'domain' });
                // We can also search by URL if needed
                store.createIndex('url_idx', 'url', { unique: false });
            }
        };
    });
};

// Function to add a record
export const addMisinformationRecord = async (record: MisinformationRecord): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record); // put() will add or update

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error adding record:', request.error);
            reject('Could not add record to the log.');
        };
    });
};

// Function to get a record by domain
export const getMisinformationRecordByDomain = async (domain: string): Promise<MisinformationRecord | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(domain);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = () => {
            console.error('Error fetching record:', request.error);
            reject('Could not fetch record from the log.');
        };
    });
};
