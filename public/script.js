// On récupère l'élément container du DOM déjà existant au chargement de la page.
const video = document.querySelector('video');
const canvas = document.querySelector('#photo');
const image = new Image();
const reset = document.querySelector('#reset');
const download = document.querySelector('#download');
const snap = document.querySelector('#snap');
const mapButton = document.querySelector('#mapButton');
const viseur = document.querySelector('#viseur');
const filters = document.querySelector('#filters');


const db = new Dexie("image_database");
db.version(1).stores({
   images: 'date,dataURL,lat,long'
});
db.open().catch(function (e) {
   console.error(e);
});

// Fonction permettant de vérifier si le navigateur est compatible avec la géolocalisation et de récupérer la position de l'utilisateur
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        console.error("Geolocation not supported !")
    }
}
// Fonction permettant d'afficher la position de l'utilisateur
function showPosition(position) {
    const formatDate = new Date(position.timestamp).toLocaleString('FR-fr');
    storeImage(position.coords.latitude, position.coords.longitude, formatDate);
}


function storeImage(lat, long, date) {
    const dataURL = canvas.toDataURL('image/png');
    db.images.put({date, lat, long, dataURL}).catch(function(error) {
       console.log(error);
    });
}

function initApp() {
            const contextViseur = viseur.getContext('2d');
            var centerY = viseur.height / 2;
            var centerX = viseur.width / 2;
            var radius = 20;

            contextViseur.beginPath();
            contextViseur.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            contextViseur.stroke();

            const context = canvas.getContext('2d');

            snap.addEventListener("click", function() {
	            context.drawImage(video, 0, 0, 640, 480);

                getLocation();
                Notification.requestPermission().then(function(permission){
                    if (permission=="granted"){
                        new Notification("New photo !",  {
                            body: "New photo added"
                        });
                    }
                })
                reset.removeAttribute('hidden');
                download.removeAttribute('hidden');
                snap.setAttribute('hidden', true);
                viseur.setAttribute('hidden', true);

                const canvasBackup = canvas.toDataURL('image/png');
                image.src = canvasBackup;
                console.log("Capture done !");
            });

            mapButton.addEventListener("click", function(e){
                if (map.hasAttribute('hidden')) {
                    map.removeAttribute('hidden');
                    viseur.setAttribute('hidden', true);
                    initMap();
                } else {
                    map.setAttribute('hidden', true);
                    viseur.removeAttribute('hidden');
                }
            });
            download.addEventListener('click', function (e) {
                const dataURL = canvas.toDataURL('image/png');
	            download.download = "photo.png";
                download.href = dataURL;
                console.log("Downloading...")
            });

            reset.addEventListener('click', function(e) {
                 context.clearRect(0, 0, canvas.width, canvas.height);
                 reset.setAttribute('hidden', true);
                download.setAttribute('hidden', true);
                viseur.removeAttribute('hidden');
                snap.removeAttribute('hidden');
                 console.log("reset !");
            });

            reglage.addEventListener('click', function(e) {
                if (filters.hasAttribute('hidden')) {
                    filters.removeAttribute('hidden');
                } else {
                    filters.setAttribute('hidden', true);
                }
            });

            const mouse = {x: 0, y: 0};
            context.lineWidth = 5;
            context.lineJoin = 'round';
            context.lineCap = 'round';
            context.strokeStyle = 'blue';

            canvas.addEventListener('mousemove', function(e) {
                mouse.x = e.pageX - this.offsetLeft;
                mouse.y = e.pageY - this.offsetTop;
            }, false);

            canvas.addEventListener('mousedown', function(e) {
                context.beginPath();
                context.moveTo(mouse.x, mouse.y);
                canvas.addEventListener('mousemove', onPaint, false);
            }, false);

            canvas.addEventListener('mouseup', function(e) {
                canvas.removeEventListener('mousemove', onPaint, false);
            }, false);

            const onPaint = function() {
                context.lineTo(mouse.x, mouse.y);
                context.stroke();
            };

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({video: true}).then(function(stream){
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                });
            } else {
                console.error("Your device can't use navigator.mediaDevices");
            }
      }

window.onload = function() {
    initApp();
};

function updateSlider()
{
    if(document.getElementById('invert').checked){
        var invert = 100;
    } else {
        var invert = 0;
    }
    if(document.getElementById('sepia').checked){
        var sepia = 100;
    } else {
        var sepia = 0;
    }
    if(document.getElementById('grayscale').checked){
        var grayscale = 100;
    } else {
        var grayscale = 0;
    }
    var saturate = document.getElementById('saturate').value;
    var brightness = document.getElementById('brightness').value;

    const context = canvas.getContext('2d');
    context.filter = "invert("+invert+") sepia("+sepia+") saturate("+saturate+") brightness("+brightness+") grayscale("+grayscale+")";
    context.drawImage(image, 0, 0, 640, 480);
}

function initMap(){
    var myLatLng = {lat: 48.41, lng: -4.49};
    var map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        scrollwheel: false,
        zoom: 12
    });
    var collection = db.images;
    collection.each(function(image) {
        var myLatLng = {lat: Number(image.lat), lng: Number(image.long)};
        var marker = new google.maps.Marker({
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            position: myLatLng
        });
        var infowindow = new google.maps.InfoWindow({
            content: `
                    <p>Votre photo le ${image.date}</p>
                    <img width="150px" alt="votre photo" src="${image.dataURL}"/>
                    `
        });
        marker.addListener('click', function() {
            infowindow.open(map, marker);
        });
    });
 }
