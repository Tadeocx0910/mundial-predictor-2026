import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBK8L_ClVKwvTRi4Csv0EbaKIOQa4pCxuY',
  authDomain: 'pronostico-mundial-2026-1ce02.firebaseapp.com',
  projectId: 'pronostico-mundial-2026-1ce02',
  storageBucket: 'pronostico-mundial-2026-1ce02.firebasestorage.app',
  messagingSenderId: '574289659605',
  appId: '1:574289659605:web:3d3cd12d7ff9cfcdd5445c',
  measurementId: 'G-FTK5JYMKL9'
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export const ADMIN_EMAILS = ['tadeobz09@gmail.com']
