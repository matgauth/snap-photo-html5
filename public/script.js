// On récupère l'élément container du DOM déjà existant au chargement de la page.
const video = document.querySelector('video');
const canvas = document.querySelector('#photo');
const reset = document.querySelector('#reset');
const download = document.querySelector('#download');
const snap = document.querySelector('#snap');
const locationInfos = document.querySelector('#location-infos');
const dialog = document.querySelector('dialog');
const viseur = document.querySelector('#viseur');

if (! dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
}

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
    locationInfos.innerHTML = `Latitude: ${position.coords.latitude.toFixed(2)}
    <br>Longitude: ${position.coords.longitude.toFixed(2)}<br> Date: ${formatDate}`;
    initMap(position.coords.latitude, position.coords.longitude);
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

            reset.style.display="none";
            download.style.display="none";

            snap.addEventListener("click", function() {
	            context.drawImage(video, 0, 0, 640, 480);
                getLocation();
                reset.style.display="inline-block";
                download.style.display="inline-block";
                snap.style.display="none";
                dialog.showModal();
                document.getElementById("viseur").style.zIndex="-101";
                console.log("Capture done !");
            });
            dialog.querySelector('.close').addEventListener('click', function() {
                dialog.close();
            });
            download.addEventListener('click', function (e) {
                const dataURL = canvas.toDataURL('image/png');
	            download.download = "photo.png";
                download.href = dataURL;
                console.log("Downloading...")
            });

            reset.addEventListener('click', function(e) {
                 context.clearRect(0, 0, canvas.width, canvas.height);
                 locationInfos.textContent = null;
                 reset.style.display="none";
                 download.style.display="none";
                 snap.style.display="inline-block";
                 console.log("reset !");
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

function updateSlider(slideAmount)
{
    const context = canvas.getContext('2d');
    let filter;
    if (document.getElementById('opacity').checked) {
        filter = "grayscale";
    } else if(document.getElementById('invert').checked){
        filter = "invert";
    } else if(document.getElementById('sepia').checked){
        filter = "sepia";
    } else if(document.getElementById('saturate').checked){
        filter = "saturate";
    }
    grayscale(slideAmount);
}

function initMap(lat, long){
    var myLatLng = {lat: Number(lat), lng: Number(long)};
    var map = new google.maps.Map(document.getElementById('map'), {        
        center: myLatLng,
        scrollwheel: false,
        zoom: 12
    });
    var marker = new google.maps.Marker({
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: myLatLng,
        title:"Hello World!"
     });
 }
