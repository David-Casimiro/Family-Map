<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
  
    const firebaseConfig = {
    apiKey: "AIzaSyBnmUDtg2Le-9YzU9YiR09p1y8BKVNTq5g",
    authDomain: "family-map-bf146.firebaseapp.com",
    projectId: "family-map-bf146",
    storageBucket: "family-map-bf146.firebasestorage.app",
    messagingSenderId: "357243545790",
    appId: "1:357243545790:web:479c80fbc1233c4ddcd6ef",
    measurementId: "G-WR1C10VQFB"
  };

   const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>