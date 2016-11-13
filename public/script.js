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

function storeImage(position) {
    const dataURL = canvas.toDataURL('image/png');
    const date = new Date(position.timestamp).toLocaleString(navigator.language);
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    db.images.put({ date, lat, long, dataURL }).catch(function (error) {
        console.log(error);
    });
}

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

function resetFilters() {
    document.getElementById('saturate').value = 1;
    document.getElementById('brightness').value = 1;
    document.getElementById('grayscale').checked = false;
    document.getElementById('invert').checked = false;
    document.getElementById('sepia').checked = false;
}

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
                    `
            });
            marker.addListener('click', function () {
                infowindow.open(map, marker);
            });
        });
    });
}

function onClickSnap() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

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

function showHideMap() {
    if (map.hasAttribute('hidden')) {
        initMap();
        map.removeAttribute('hidden');
        video.setAttribute('hidden', true);
        sights.setAttribute('hidden', true);
        canvas.setAttribute('hidden', true);
    } else {
        map.setAttribute('hidden', true);
        sights.removeAttribute('hidden');
        video.removeAttribute('hidden');
        canvas.removeAttribute('hidden');
    }
}

function onClickReset() {
    resetFilters();
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

function onClickDownload() {
    const dataURL = canvas.toDataURL('image/png');
    download.download = "photo.png";
    download.href = dataURL;
    console.log("Downloading...");
}

function showHideSettings() {
    filters.hasAttribute('hidden') ? filters.removeAttribute('hidden') : filters.setAttribute('hidden', true);
}

function addSights() {
    const image = new Image();
    image.src = 'http://www.earrelaphant.com/wp-content/uploads/2016/03/sniper-297661_640-218x218.png';
    image.onload = function () {
        sights.getContext('2d').drawImage(image,
            sights.width / 2 - image.width / 2,
            sights.height / 2 - image.height / 2
        );
    }
}

function initApp() {
    addSights();

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

