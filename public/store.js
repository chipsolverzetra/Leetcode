// Accounts and favorites.
// With a Firebase config: Firebase Auth (email/password + Google) and Firestore at users/{uid}.
// Without one: favorites live in localStorage and the sign-in button is hidden.

import { firebaseConfig } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
const LOCAL_KEY = 'nyc-transit-hub:favorites';
const empty = () => ({ lines: [], stations: [], notify: false });

let fb = null; // { auth, db, api }
let user = null;
const listeners = new Set();

function readLocal() {
  try { return { ...empty(), ...JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') }; } catch { return empty(); }
}
function writeLocal(favs) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(favs)); } catch { /* storage blocked */ }
}

export const accountsEnabled = () => Boolean(firebaseConfig.apiKey);
export const currentUser = () => user;
export const onAuthChange = (cb) => { listeners.add(cb); cb(user); return () => listeners.delete(cb); };

export async function initStore() {
  if (!accountsEnabled()) return;
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  fb = { auth: authMod.getAuth(app), db: fsMod.getFirestore(app), authMod, fsMod };
  authMod.onAuthStateChanged(fb.auth, async (u) => {
    user = u ? { uid: u.uid, email: u.email, name: u.displayName } : null;
    if (user) {
      // First sign-in on this device: merge anything saved locally into the account.
      const local = readLocal();
      const remote = await loadFavorites();
      const merged = {
        lines: [...new Set([...remote.lines, ...local.lines])],
        stations: [...new Set([...remote.stations, ...local.stations])],
        notify: remote.notify || local.notify,
      };
      await saveFavorites(merged);
    }
    listeners.forEach((cb) => cb(user));
  });
}

export async function loadFavorites() {
  if (!fb || !user) return readLocal();
  const { doc, getDoc } = fb.fsMod;
  const snap = await getDoc(doc(fb.db, 'users', user.uid));
  return { ...empty(), ...(snap.exists() ? snap.data().favorites : {}) };
}

export async function saveFavorites(favs) {
  writeLocal(favs);
  if (!fb || !user) return;
  const { doc, setDoc, serverTimestamp } = fb.fsMod;
  await setDoc(doc(fb.db, 'users', user.uid), { favorites: favs, updatedAt: serverTimestamp() }, { merge: true });
}

export async function signIn(email, password) {
  return fb.authMod.signInWithEmailAndPassword(fb.auth, email, password);
}
export async function signUp(email, password) {
  return fb.authMod.createUserWithEmailAndPassword(fb.auth, email, password);
}
export async function signInWithGoogle() {
  return fb.authMod.signInWithPopup(fb.auth, new fb.authMod.GoogleAuthProvider());
}
export async function signOut() {
  return fb.authMod.signOut(fb.auth);
}
