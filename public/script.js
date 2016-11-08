// On récupère l'élément container du DOM déjà existant au chargement de la page.
const container = document.getElementById('container');

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
    document.getElementById('location-infos').innerHTML = `Latitude: ${position.coords.latitude.toFixed(2)}
    <br>Longitude: ${position.coords.longitude.toFixed(2)}<br> Date: ${new Date(position.timestamp).toLocaleString('FR-fr')}`;
}
// Via Firebase (BaaS), on crée un bouton permettant de toggle la connexion et la déconnexion de manière anonyme.
function toggleSignIn() {
    if (!firebase.auth().currentUser) {
        firebase.auth().signInAnonymously().catch(function(error) {
          const errorCode = error.code;
          const errorMessage = error.message;
          if (errorCode === 'auth/operation-not-allowed') {
            alert('You must enable Anonymous auth in the Firebase Console.');
          } else {
            console.error(error);
          }
        });
    } else {
        firebase.auth().signOut();
        container.removeChild(document.getElementById('video'));
        container.removeChild(document.getElementById('canvas'));
        container.removeChild(document.getElementById('snap'));
        container.removeChild(document.getElementById('reset'));
        container.removeChild(document.getElementById('download'));
        container.removeChild(document.getElementById('location-infos'));
    }
    document.getElementById('sign-in').disabled = true;
}

function initApp() {
    firebase.auth().onAuthStateChanged(function(user){
        const signIn = document.getElementById('sign-in');
        if(user){
            const snap = document.createElement('button');
            container.appendChild(snap);
            snap.textContent = 'Prendre une photo';
            snap.className = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent';
            snap.setAttribute('id', 'snap');

            const download = document.createElement('a');
            container.appendChild(download);
            download.textContent = 'Sauvegarder';
            download.className = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary';
            download.setAttribute('id', 'download');

            const reset = document.createElement('button');
            container.appendChild(reset);
            reset.textContent = 'Restaurer';
            reset.className = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect';
            reset.setAttribute('id', 'reset');

			const viseur = document.createElement('canvas');
			container.appendChild(viseur);
            viseur.setAttribute('id', 'viseur');
			var ctx = viseur.getContext("2d");
			ctx.beginPath();
			ctx.arc(150,75,40,0,2*Math.PI);
			ctx.stroke();

            const video = document.createElement('video');
            container.appendChild(video);
            video.className = 'mdl-card mdl-shadow--2dp';
            video.setAttribute('id', 'video');
            video.setAttribute('autoplay', true);

            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            canvas.setAttribute('width', '640');
            canvas.setAttribute('height', '480');
            canvas.setAttribute('id', 'canvas');

            signIn.textContent = 'Sign out';

            const context = canvas.getContext('2d');

            const locationInfos = document.createElement('p');
            container.appendChild(locationInfos);
            locationInfos.setAttribute('id', 'location-infos');

            snap.addEventListener("click", function() {
                var v = document.getElementById("audio");
                v.play();
	            context.drawImage(video, 0, 0, 640, 480);
                getLocation();
            });

            download.addEventListener('click', function (e) {
                const dataURL = canvas.toDataURL('image/png');
	            download.download = "photo.png";
                download.href = dataURL;
            });

            reset.addEventListener('click', function(e) {
                 context.clearRect(0, 0, canvas.width, canvas.height);
                 document.getElementById('location-infos').textContent = null;
            });


            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({video: true}).then(function(stream){
                    video.src = window.URL.createObjectURL(stream);
                    video.play();
                });
            } else {
                console.error("Your device can't use navigator.mediaDevices");
            }
        } else {

            signIn.textContent = 'Se connecter anonymement';
        }
        document.getElementById('sign-in').disabled = false;
    });
    document.getElementById('sign-in').addEventListener('click', toggleSignIn, false);
}

window.onload = function() {
    initApp();
};

function updateSlider(slideAmount)
{
    if (document.getElementById('opacity').checked) {
        var filtre = "opacity";
    } else if(document.getElementById('invert').checked){
        var filtre = "invert";
    } else if(document.getElementById('sepia').checked){
        var filtre = "sepia";
    } else if(document.getElementById('saturate').checked){
        var filtre = "saturate";
    }
    document.getElementById('canvas').style.filter = filtre+"("+slideAmount+"%)";
}