import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const $ = (id) => document.getElementById(id);

const authScreen = $("authScreen");
const mainScreen = $("mainScreen");
const authMessage = $("authMessage");

const loginTab = $("loginTab");
const registerTab = $("registerTab");
const loginForm = $("loginForm");
const registerForm = $("registerForm");

const userPhoto = $("userPhoto");
const userName = $("userName");
const userEmail = $("userEmail");
const familyCodeLabel = $("familyCodeLabel");

const profileForm = $("profileForm");
const profileName = $("profileName");
const profilePhoto = $("profilePhoto");

const startSharingBtn = $("startSharingBtn");
const stopSharingBtn = $("stopSharingBtn");
const centerMapBtn = $("centerMapBtn");
const locationStatus = $("locationStatus");

const placeForm = $("placeForm");
const placeId = $("placeId");
const placeName = $("placeName");
const placeType = $("placeType");
const placeLat = $("placeLat");
const placeLng = $("placeLng");
const useCurrentLocationBtn = $("useCurrentLocationBtn");
const clearPlaceFormBtn = $("clearPlaceFormBtn");
const placesList = $("placesList");
const membersList = $("membersList");

let currentUser = null;
let currentProfile = null;
let currentPosition = null;
let watchId = null;

let map = null;
let userMarkers = {};
let placeMarkers = {};

let unsubscribeMembers = null;
let unsubscribePlaces = null;

const defaultAvatar = "./assets/default-avatar.svg";

function showMessage(text) {
  authMessage.textContent = text || "";
}

function switchTab(tab) {
  if (tab === "login") {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  } else {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  }
}

loginTab.addEventListener("click", () => switchTab("login"));
registerTab.addEventListener("click", () => switchTab("register"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("Entrando...");

  try {
    await signInWithEmailAndPassword(
      auth,
      $("loginEmail").value.trim(),
      $("loginPassword").value
    );
    showMessage("");
  } catch (error) {
    showMessage("Erro ao entrar: " + error.message);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("Criando conta...");

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim();
  const password = $("registerPassword").value;
  const familyCode = $("registerFamilyCode").value.trim().toUpperCase();

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    await setDoc(doc(db, "users", uid), {
      uid,
      name,
      email,
      familyCode,
      photoUrl: "",
      sharingLocation: false,
      lastLocation: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await setDoc(doc(db, "families", familyCode), {
      code: familyCode,
      updatedAt: serverTimestamp()
    }, { merge: true });

    showMessage("");
  } catch (error) {
    showMessage("Erro ao cadastrar: " + error.message);
  }
});

$("logoutBtn").addEventListener("click", async () => {
  stopLocationSharing();
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    cleanupRealtime();
    authScreen.classList.remove("hidden");
    mainScreen.classList.add("hidden");
    return;
  }

  const profileSnap = await getDoc(doc(db, "users", user.uid));

  if (!profileSnap.exists()) {
    await signOut(auth);
    alert("Perfil não encontrado.");
    return;
  }

  currentProfile = profileSnap.data();

  authScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");

  renderProfile();
  initMap();
  listenFamilyMembers();
  listenMyPlaces();
});

function renderProfile() {
  userName.textContent = currentProfile.name || "Usuário";
  userEmail.textContent = currentProfile.email || currentUser.email;
  familyCodeLabel.textContent = currentProfile.familyCode || "";
  userPhoto.src = currentProfile.photoUrl || defaultAvatar;
  profileName.value = currentProfile.name || "";
}

function initMap() {
  if (map) return;

  map = L.map("map").setView([-14.235, -51.9253], 4);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

function listenFamilyMembers() {
  if (unsubscribeMembers) unsubscribeMembers();

  const q = query(
    collection(db, "users"),
    where("familyCode", "==", currentProfile.familyCode)
  );

  unsubscribeMembers = onSnapshot(q, (snapshot) => {
    membersList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const member = docSnap.data();
      renderMemberInList(member);
      renderMemberOnMap(member);
    });
  });
}

function renderMemberInList(member) {
  const li = document.createElement("li");
  const online = member.sharingLocation && member.lastLocation;
  const updatedAt = member.lastLocation?.updatedAt?.toDate
    ? member.lastLocation.updatedAt.toDate().toLocaleString("pt-BR")
    : "Sem atualização";

  li.innerHTML = `
    <div class="member">
      <img src="${member.photoUrl || defaultAvatar}" alt="Foto de ${escapeHtml(member.name || "Usuário")}">
      <div>
        <strong>${escapeHtml(member.name || "Usuário")}</strong>
        <small>${online ? "Compartilhando localização" : "Localização pausada"}</small>
        <small>Última atualização: ${updatedAt}</small>
      </div>
    </div>
  `;

  membersList.appendChild(li);
}

function renderMemberOnMap(member) {
  if (!map) return;

  const uid = member.uid;

  if (!member.sharingLocation || !member.lastLocation) {
    if (userMarkers[uid]) {
      map.removeLayer(userMarkers[uid]);
      delete userMarkers[uid];
    }
    return;
  }

  const lat = member.lastLocation.lat;
  const lng = member.lastLocation.lng;

  const icon = L.divIcon({
    className: "custom-user-marker",
    html: `<div style="
      width:42px;height:42px;border-radius:50%;
      border:3px solid #2f80ed;background:#111827;
      background-image:url('${member.photoUrl || defaultAvatar}');
      background-size:cover;background-position:center;
      box-shadow:0 6px 18px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });

  const popup = `
    <div class="popup-user">
      <img src="${member.photoUrl || defaultAvatar}" alt="">
      <h3>${escapeHtml(member.name || "Usuário")}</h3>
      <p>Precisão: ${Math.round(member.lastLocation.accuracy || 0)}m</p>
      <p>Atualizado: ${
        member.lastLocation.updatedAt?.toDate
          ? member.lastLocation.updatedAt.toDate().toLocaleString("pt-BR")
          : "agora"
      }</p>
    </div>
  `;

  if (userMarkers[uid]) {
    userMarkers[uid].setLatLng([lat, lng]).setIcon(icon).setPopupContent(popup);
  } else {
    userMarkers[uid] = L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
  }
}

startSharingBtn.addEventListener("click", () => {
  startLocationSharing();
});

stopSharingBtn.addEventListener("click", () => {
  stopLocationSharing();
});

centerMapBtn.addEventListener("click", () => {
  if (currentPosition && map) {
    map.setView([currentPosition.lat, currentPosition.lng], 16);
  } else {
    alert("Nenhuma localização atual disponível.");
  }
});

async function startLocationSharing() {
  if (!navigator.geolocation) {
    alert("Este navegador não suporta geolocalização.");
    return;
  }

  locationStatus.textContent = "Solicitando permissão de localização...";

  await updateDoc(doc(db, "users", currentUser.uid), {
    sharingLocation: true,
    updatedAt: serverTimestamp()
  });

  watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const coords = position.coords;
      currentPosition = {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy
      };

      locationStatus.textContent = `Compartilhando localização. Precisão aproximada: ${Math.round(coords.accuracy)}m`;

      await updateDoc(doc(db, "users", currentUser.uid), {
        sharingLocation: true,
        lastLocation: {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          speed: coords.speed,
          heading: coords.heading,
          updatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    },
    (error) => {
      locationStatus.textContent = "Erro de localização: " + error.message;
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    }
  );
}

async function stopLocationSharing() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (currentUser) {
    await updateDoc(doc(db, "users", currentUser.uid), {
      sharingLocation: false,
      updatedAt: serverTimestamp()
    });
  }

  locationStatus.textContent = "Localização pausada.";
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newName = profileName.value.trim();
  let photoUrl = currentProfile.photoUrl || "";

  try {
    const file = profilePhoto.files[0];

    if (file) {
      const fileRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      photoUrl = await getDownloadURL(fileRef);
    }

    await updateDoc(doc(db, "users", currentUser.uid), {
      name: newName,
      photoUrl,
      updatedAt: serverTimestamp()
    });

    currentProfile = {
      ...currentProfile,
      name: newName,
      photoUrl
    };

    renderProfile();
    alert("Perfil atualizado.");
  } catch (error) {
    alert("Erro ao salvar perfil: " + error.message);
  }
});

function listenMyPlaces() {
  if (unsubscribePlaces) unsubscribePlaces();

  const q = query(collection(db, "places"), where("userId", "==", currentUser.uid));

  unsubscribePlaces = onSnapshot(q, (snapshot) => {
    placesList.innerHTML = "";

    Object.values(placeMarkers).forEach((marker) => map.removeLayer(marker));
    placeMarkers = {};

    snapshot.forEach((docSnap) => {
      const place = { id: docSnap.id, ...docSnap.data() };
      renderPlaceInList(place);
      renderPlaceOnMap(place);
    });
  });
}

function renderPlaceInList(place) {
  const li = document.createElement("li");

  li.innerHTML = `
    <div class="row">
      <div>
        <strong>${escapeHtml(place.name)}</strong>
        <small>${escapeHtml(place.type)} • ${Number(place.lat).toFixed(5)}, ${Number(place.lng).toFixed(5)}</small>
      </div>
    </div>
    <div class="list-actions">
      <button data-action="view">Ver no mapa</button>
      <button data-action="edit">Editar</button>
      <button data-action="delete" class="danger">Excluir</button>
    </div>
  `;

  li.querySelector('[data-action="view"]').addEventListener("click", () => {
    map.setView([place.lat, place.lng], 16);
  });

  li.querySelector('[data-action="edit"]').addEventListener("click", () => {
    placeId.value = place.id;
    placeName.value = place.name;
    placeType.value = place.type;
    placeLat.value = place.lat;
    placeLng.value = place.lng;
  });

  li.querySelector('[data-action="delete"]').addEventListener("click", async () => {
    if (confirm("Deseja excluir este lugar?")) {
      await deleteDoc(doc(db, "places", place.id));
    }
  });

  placesList.appendChild(li);
}

function renderPlaceOnMap(place) {
  if (!map) return;

  const marker = L.marker([place.lat, place.lng]).addTo(map);
  marker.bindPopup(`
    <strong>${escapeHtml(place.name)}</strong><br>
    ${escapeHtml(place.type)}<br>
    ${Number(place.lat).toFixed(5)}, ${Number(place.lng).toFixed(5)}
  `);

  placeMarkers[place.id] = marker;
}

placeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = {
    userId: currentUser.uid,
    familyCode: currentProfile.familyCode,
    name: placeName.value.trim(),
    type: placeType.value,
    lat: Number(placeLat.value),
    lng: Number(placeLng.value),
    updatedAt: serverTimestamp()
  };

  if (!data.name || Number.isNaN(data.lat) || Number.isNaN(data.lng)) {
    alert("Preencha nome, latitude e longitude corretamente.");
    return;
  }

  try {
    if (placeId.value) {
      await updateDoc(doc(db, "places", placeId.value), data);
    } else {
      await addDoc(collection(db, "places"), {
        ...data,
        createdAt: serverTimestamp()
      });
    }

    clearPlaceForm();
  } catch (error) {
    alert("Erro ao salvar lugar: " + error.message);
  }
});

useCurrentLocationBtn.addEventListener("click", () => {
  if (currentPosition) {
    placeLat.value = currentPosition.lat;
    placeLng.value = currentPosition.lng;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      placeLat.value = position.coords.latitude;
      placeLng.value = position.coords.longitude;
    },
    (error) => alert("Erro ao pegar localização: " + error.message),
    { enableHighAccuracy: true }
  );
});

clearPlaceFormBtn.addEventListener("click", clearPlaceForm);

function clearPlaceForm() {
  placeId.value = "";
  placeName.value = "";
  placeType.value = "Casa";
  placeLat.value = "";
  placeLng.value = "";
}

function cleanupRealtime() {
  if (unsubscribeMembers) unsubscribeMembers();
  if (unsubscribePlaces) unsubscribePlaces();
  unsubscribeMembers = null;
  unsubscribePlaces = null;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
