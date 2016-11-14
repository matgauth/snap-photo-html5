// On récupère l'élément container du DOM déjà existant au chargement de la page.
const video = document.querySelector('video');
const canvas = document.querySelector('#canvas');
const reset = document.querySelector('#reset');
const download = document.querySelector('#download');
const snap = document.querySelector('#snap');
const mapButton = document.querySelector('#mapButton');
const sights = document.querySelector('#sights');
const filters = document.querySelector('#filters');
const map = document.querySelector('#map');
const image = document.createElement('img');

const db = new Dexie("image_database");
db.version(1).stores({
    images: 'date,dataURL,lat,long'
});
db.open().catch(function (e) {
    console.error(e);
});

// Fonction permettant de vérifier si le navigateur est compatible avec la géolocalisation et de récupérer la position de l'utilisateur
function getLocation(cb) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(cb);
    } else {
        console.error("Geolocation not supported !")
    }
}

// Fonction permettant l'enregistrement des photos
function storeImage(position) {
    const dataURL = canvas.toDataURL('image/png');
    const date = new Date(position.timestamp).toLocaleString(navigator.language);
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    db.images.put({ date, lat, long, dataURL }).catch(function (error) {
        console.log(error);
    });
}

// Fonction de demande des droits pour les Notifications
function notificationPermission() {
    Notification.requestPermission().then(function (permission) {
        if (permission == "granted") {
            new Notification("Nouvelle photo !", {
                icon: './notif.png',
                body: "Vous avez ajouté un marqueur sur la carte."
            });
        }
    })
}

// Fonction qui récupère les valeurs des filtres et les applique à la photo capturée
function updateSlider(e) {
    if (e.target !== e.currentTarget) {
        let invert = document.getElementById('invert').checked ? 100 : 0;
        let sepia = document.getElementById('sepia').checked ? 100 : 0;
        let grayscale = document.getElementById('grayscale').checked ? 100 : 0;
        let saturate = document.getElementById('saturate').value;
        let brightness = document.getElementById('brightness').value;

        canvas.getContext('2d').filter = `invert(${invert}) sepia(${sepia}) saturate(${saturate}) brightness(${brightness}) grayscale(${grayscale})`;
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    e.stopPropagation();
}

// Fonction qui réinitialise les filtres
function resetFilters() {
    document.getElementById('saturate').MaterialSlider.change(1);
    document.getElementById('brightness').MaterialSlider.change(1);
    document.getElementById('grayscale').checked = false;
    document.getElementById('invert').checked = false;
    document.getElementById('sepia').checked = false;
}

// Fonction qui initialise la carte GoogleMap
function initMap() {
    const collection = db.images;
    getLocation(function (position) {
        const myLatLng = { lat: position.coords.latitude, lng: position.coords.longitude };
        const gmap = new google.maps.Map(map, {
            center: myLatLng,
            scrollwheel: true,
            zoom: 12
        });
        collection.each(function (image) {
            const position = { lat: Number(image.lat), lng: Number(image.long) };
            const marker = new google.maps.Marker({
                map: gmap,
                draggable: true,
                animation: google.maps.Animation.DROP,
                position
            });
            const infowindow = new google.maps.InfoWindow({
                content: `
                    <p>Votre photo le ${image.date}</p>
                    <img width="150px" alt="votre photo" src="${image.dataURL}"/>
                    <ul>
                        <li>Latitude: ${image.lat.toFixed(2)}</li>
                        <li>longitude: ${image.long.toFixed(2)}</li>
                    <ul>
                    `
            });
            marker.addListener('click', function () {
                infowindow.open(map, marker);
            });
        });
    });
}

function playAudio(e) {
    e.preventDefault();
    console.log('Playing audio');
    const audio = new Audio('static/snap.wav');
    audio.play();
}

// Fonction appelé lors de l'appuie sur l'icone capture
function onClickSnap(e) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    document.getElementById("sights").style.zIndex = -100;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    playAudio(e);
    getLocation(storeImage);
    notificationPermission();

    reset.removeAttribute('hidden');
    download.removeAttribute('hidden');
    canvas.removeAttribute('hidden');
    snap.setAttribute('hidden', true);
    sights.setAttribute('hidden', true);
    reglage.removeAttribute('hidden');

    const data = canvas.toDataURL('image/png');
    image.setAttribute('src', data);
    console.log("Capture done !");
}

// Fonction permettant de gérer l'affichage de la carte
function showHideMap() {
    if (map.hasAttribute('hidden')) {
        initMap();
        snap.removeEventListener("click", onClickSnap, false);
        snap.addEventListener("click", showHideMap, false);
        map.removeAttribute('hidden');
        video.setAttribute('hidden', true);
        sights.setAttribute('hidden', true);
        canvas.setAttribute('hidden', true);
    } else {
        snap.addEventListener("click", onClickSnap, false);
        snap.removeEventListener("click", showHideMap, false);
        sights.removeAttribute('hidden');
        map.setAttribute('hidden', true);
        video.removeAttribute('hidden');
        canvas.removeAttribute('hidden');
    }
}

// Fonction appelé lors du click sur le boutton reset. Reviens à la capture
function onClickReset() {
    resetFilters();
    document.getElementById("sights").style.zIndex = -99;
    canvas.getContext('2d').clearRect(0, 0, video.videoWidth, video.videoHeight);
    reset.setAttribute('hidden', true);
    canvas.setAttribute('hidden', true);
    download.setAttribute('hidden', true);
    filters.setAttribute('hidden', true);
    reglage.setAttribute('hidden', true);
    sights.removeAttribute('hidden');
    snap.removeAttribute('hidden');
    console.log("reset !");
}

// Fonction appelé lors du click sur le boutton téléchargé. Télécharge l'image avec les filtres appliqués
function onClickDownload() {
    const dataURL = canvas.toDataURL('image/png');
    download.download = "photo.png";
    download.href = dataURL;
    console.log("Downloading...");
}

// Fonction qui permet de gérer l'affichage des réglages des filtres
function showHideSettings() {
    filters.hasAttribute('hidden') ? filters.removeAttribute('hidden') : filters.setAttribute('hidden', true);
}

// Fonction qui permet de dessiner le viseur sur la prise video
function addSights() {
    const contextViseur = sights.getContext('2d');
    var centerY = sights.height / 2;
    var centerX = sights.width / 2;
    var radius = 40;
    contextViseur.beginPath();
    contextViseur.arc(centerX, centerY, radius, 0, 2 * Math.PI, true); // Dessine le cercle
    contextViseur.moveTo(100, 75);
    contextViseur.lineTo(200, 75);                                      // Dessine la première ligne
    contextViseur.moveTo(150, 25);
    contextViseur.lineTo(150, 125);                                     // Dessine la seconde ligne
    contextViseur.stroke();
}

// Initialise l'application
function initApp() {
    addSights(); // Ajoute le viseur

    // Ajout des listener sur les bouttons.
    snap.addEventListener("click", onClickSnap, false);
    mapButton.addEventListener("click", showHideMap, false);
    download.addEventListener('click', onClickDownload, false);
    reset.addEventListener('click', onClickReset, false);
    reglage.addEventListener('click', showHideSettings, false);
    filters.addEventListener('change', updateSlider, false);

    const mouse = { x: 0, y: 0 };
    const context = canvas.getContext('2d');
    context.lineWidth = 5;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.strokeStyle = 'blue';

    canvas.addEventListener('mousemove', function (e) {
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
    }, false);

    canvas.addEventListener('mousedown', function (e) {
        context.beginPath();
        context.moveTo(mouse.x, mouse.y);
        canvas.addEventListener('mousemove', onPaint, false);
    }, false);

    canvas.addEventListener('mouseup', function (e) {
        canvas.removeEventListener('mousemove', onPaint, false);
    }, false);

    const onPaint = function () {
        context.lineTo(mouse.x, mouse.y);
        context.stroke();
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        });
    } else {
        console.error("Your device can't use navigator.mediaDevices");
    }
}

window.onload = function () {
    initApp();
};

