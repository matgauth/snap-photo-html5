const container = document.getElementById('user-details-container');
const containerVideo = document.getElementById('user-video-container');
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        console.error("Geolocation not supported !")
    }
}

function showPosition(position) {
    document.getElementById('location-infos').innerHTML = `Latitude: ${position.coords.latitude.toFixed(2)}
    <br>Longitude: ${position.coords.longitude.toFixed(2)}`;
}

function toggleSignIn() {
    if (!firebase.auth().currentUser) {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/plus.login');
        firebase.auth().signInWithPopup(provider).then(function(result){
            const token = result.credential.accessToken;
            const user = result.user;
            console.log(user);
        }).catch(function(error) {
            const errCode = error.code;
            const errMsg = error.message;
            if (errCode === 'auth/account-exists-with-different-credential') {
               alert('You have already signed up with a different auth provider for that email.');
            } else {
               console.error(errMsg);
            }
        });
    } else {
        firebase.auth().signOut();
        containerVideo.removeChild(document.getElementById('video'));
        container.removeChild(document.getElementById('canvas'));
        container.removeChild(document.getElementById('snap'));
        container.removeChild(document.getElementById('download'));
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
						containerVideo.appendChild(viseur);
            viseur.setAttribute('id', 'viseur');
						var ctx = viseur.getContext("2d");
						ctx.beginPath();
						ctx.arc(150,75,40,0,2*Math.PI);
						ctx.stroke();

            const video = document.createElement('video');
            containerVideo.appendChild(video);
            video.setAttribute('id', 'video');
            video.setAttribute('autoplay', true);

            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            canvas.setAttribute('width', '640');
            canvas.setAttribute('height', '480');
            canvas.setAttribute('id', 'canvas');

            signIn.textContent = 'Sign out';

            const context = canvas.getContext('2d');
            const date = document.getElementById('date');

            snap.addEventListener("click", function() {
	            context.drawImage(video, 0, 0, 640, 480);
	            date.innerHTML =`Date : ${new Date(Date.now()).toLocaleString('FR-fr')}`;
                getLocation();
            });

            download.addEventListener('click', function (e) {
                const dataURL = canvas.toDataURL('image/png');
	            download.download = "photo.png";
                download.href = dataURL;
            });

            reset.addEventListener('click', function(e) {
                 context.clearRect(0, 0, canvas.width, canvas.height);
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

            signIn.textContent = 'Sign in with Google';
        }
        document.getElementById('sign-in').disabled = false;
    });
    document.getElementById('sign-in').addEventListener('click', toggleSignIn, false);
}

window.onload = function() {
    initApp();
};
