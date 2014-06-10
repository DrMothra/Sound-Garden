/**
 * Created by DrTone on 28/05/2014.
 */

//Audio playback
var Sound = function(source, pos, radius, volume) {
    var audio = document.createElement('audio');

    var src = document.createElement('source');
    audio.addEventListener('error', function(e) {
        alert('Audio error');
        console.log(e);
    }, false);

    //Get file extension
    var fileExt = null;
    var ext = source.indexOf('.');
    if(ext >= 0) {
        var start = ext+1;
        fileExt = source.substr(start, source.length-start);
    }
    if(!fileExt) {
        alert("Couldn't load sound file!");
        return;
    }
    var audioType = 'audio/';
    switch (fileExt) {
        case 'mp3':
            audioType += 'mp3';
            break;
        case 'm4a':
            audioType += 'mp4';
            break;
        case 'ogg':
        case 'oga':
            audioType += 'ogg';
            break;
    }

    src.src = source;
    src.type = audioType;
    //src.preload = 'none';

    audio.appendChild(src);
    //Always loop audio
    audio.loop = true;

    var audioPosition = new THREE.Vector3(pos.x, pos.y, pos.z);
    var audioRadius = radius;
    var audioVolume = volume;

    return {
        play: function() {
            audio.play();
        },
        pause: function() {
            audio.pause();
        },
        setVolume: function(volume) {
            audio.volume = volume;
        },
        getPosition: function() {
            return audioPosition;
        },
        getRadius: function() {
            return audioRadius;
        },
        getVolume: function() {
            return audioVolume;
        }
    };
};

function getNearestTrack(pos, group) {
    //Traverse group and check all children
    var smallest = 1000000;
    var nearestTrack = -1;
    var temp = new THREE.Vector3(0,0,0);
    for(var child=0; child<group.children.length; ++child) {
        var trackPos = group.children[child].position;
        temp.copy(trackPos);
        temp = group.localToWorld(temp);
        var dist = pos.distanceTo(temp);
        if(dist < smallest) {
            nearestTrack = child;
            smallest = dist;
        }
    }

    return nearestTrack;
}

//Init this app
function SoundApp() {
    BaseApp.call(this);
}

SoundApp.prototype = new BaseApp();

SoundApp.prototype.init = function(container) {
    BaseApp.prototype.init.call(this, container);
    this.guiControls = null;
    this.worldWidth = 256;
    this.worldDepth = 256;
    this.animate = false;
    this.animating = false;
    this.totalDelta = 0;
    this.carousels = [];
    this.carouselNum = -1;
    this.animationTime = 2;
    this.audioTrack = 0;
};

SoundApp.prototype.update = function() {
    //Perform any updates
    var delta = this.clock.getDelta();

    //Play music when user nearby
    var camPos = this.controls.getObject().position;
    for(var car=0; car<this.carousels.length; ++car) {
        var dist = this.carousels[car].position.distanceTo(camPos);
        var currentCarousel = this.carouselNum >= 0 ? this.carousels[this.carouselNum] : null;
        var currentTrack = currentCarousel ? currentCarousel.audioObjects[currentCarousel.currentTrack] : null;

        if(dist <= this.audioRadius) {
            var track = getNearestTrack(camPos, this.carousels[car]);
            if(car != this.carouselNum || track != currentCarousel.currentTrack) {
                this.carouselNum = car;
                currentCarousel = this.carousels[this.carouselNum];
                if(currentCarousel.currentTrack >= 0){
                    currentTrack = currentCarousel.audioObjects[currentCarousel.currentTrack];
                    currentTrack.pause();
                }
                currentCarousel.currentTrack = track;
                currentTrack = currentCarousel.audioObjects[currentCarousel.currentTrack];
                currentTrack.play();

                //DEBUG
                console.log('Track = ', track, ' car =', this.carouselNum);
            }
            if(currentTrack) {
                var volume = currentTrack.getVolume() * (1-dist / currentTrack.getRadius());
                currentTrack.setVolume(volume);
                //DEBUG
                //console.log('Volume =', volume);
            } else {
                console.log('No track');
            }
            break;
        } else {
            if(this.carouselNum >= 0) {
                currentCarousel = this.carousels[this.carouselNum];
                if(currentCarousel.currentTrack >= 0) {
                    currentTrack = currentCarousel.audioObjects[currentCarousel.currentTrack];
                    currentTrack.setVolume(0);
                }
            }
        }
    }

    //Only animate carousel when nearby
    if(this.animate && !this.animating) {
        this.animating = true;
        this.animate = false;
        this.startRot = this.carousels[this.carouselNum].rotation.y;
    }
    if(this.animating) {
        //DEBUG
        //console.log("Delta =", delta);
        this.carousels[this.carouselNum].rotation.y += (delta/this.animationTime) * this.rotInc;
        this.totalDelta += delta;
        if(this.totalDelta >= this.animationTime) {
            this.animating = false;
            this.totalDelta = 0;
            this.carousels[this.carouselNum].rotation.y = this.startRot + this.rotInc;
        }
    }

    //DEBUG
    //console.log("Volume =", this.audio.volume);

    var pitch = this.controls.getObject();
    this.cameraCube.rotation.copy( this.controls.getObject().rotation );
    this.cameraCube.rotation.x = pitch.children[0].rotation.x;
    //console.log('Pitch=', pitch.children[0].rotation);
    this.renderer.render(this.sceneCube, this.cameraCube);
    BaseApp.prototype.update.call(this);
};

SoundApp.prototype.generateTerrain = function() {
    //Generate relatively smooth terrain
    var size = this.worldWidth * this.worldDepth, data = new Float32Array( size ),
        perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

    for ( var i = 0; i < size; i ++ ) {
        data[ i ] = 0;
    }

    for ( var j = 0; j < 4; j ++ ) {
        for ( var i = 0; i < size; i ++ ) {
            var x = i % this.worldWidth, y = ~~ ( i / this.worldWidth );
            data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 0.25 );
        }

        quality *= 5;

    }

    return data;
};

SoundApp.prototype.createScene = function() {
    //Init base createsScene
    BaseApp.prototype.createScene.call(this);
    var data = this.generateTerrain();
    var geometry = new THREE.PlaneGeometry(1500, 1500, this.worldWidth - 1, this.worldDepth - 1);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    for (var i = 0; i < geometry.vertices.length; i++) {
        geometry.vertices[ i ].y = data[ i ] * 1.25;
    }

    var texture = THREE.ImageUtils.loadTexture("images/sand_texture1013.jpg");
    var material = new THREE.MeshPhongMaterial({map: texture});

    var mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    //Skybox
    this.cameraCube = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000 );

    this.sceneCube = new THREE.Scene();
    var r = "textures/cube/";
    var urls = [ r + "px.jpg", r + "nx.jpg",
            r + "py.jpg", r + "ny.jpg",
            r + "pz.jpg", r + "nz.jpg" ];

    var textureCube = THREE.ImageUtils.loadTextureCube( urls );
    textureCube.format = THREE.RGBFormat;

    var shader = THREE.ShaderLib[ "cube" ];
    shader.uniforms[ "tCube" ].value = textureCube;

    var skyMaterial = new THREE.ShaderMaterial( {

            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: shader.uniforms,
            depthWrite: false,
            side: THREE.BackSide
    });

    var skyMesh = new THREE.Mesh( new THREE.BoxGeometry( 1000, 1000, 1000 ), skyMaterial );
    this.sceneCube.add( skyMesh );

    //Create audio carousels
    this.audioRadius = 300;
    //Rock carousel
    var images = ['soundgarden.jpg', 'alterbridge.jpg', 'blacksabbath.jpg', 'ledzeppelin.png', 'pearljam.jpg', 'foofighters.jpg'];
    var tracks = ['soundgardenCut.mp3', 'alterbridgeCut.mp3', 'blacksabbathCut.mp3', 'ledzeppelinCut.mp3', 'pearljamCut.mp3', 'foofightersCut.mp3'];
    var pos = new THREE.Vector3(600, 0, -600);
    this.createCarousel('rock', pos, images, tracks);

    images = ['mozart.jpg', 'beethoven.jpg', 'vivaldi.jpg', 'barber.jpg', 'chopin.jpg', 'bach.jpg'];
    tracks = ['mozartCut.mp3', 'beethovenCut.mp3', 'vivaldiCut.mp3', 'barber.ogg', 'chopin.ogg', 'bachCut.mp3'];
    pos.set(-600, 0, -600);
    this.createCarousel('classical', pos, images, tracks);
};

SoundApp.prototype.createCarousel = function(name, pos, images, tracks) {
    //Create group for carousel
    var group = new THREE.Object3D();
    group.name = name;
    //Create sprites for carousel
    var spriteHeight = 100;
    var frontX = 0, frontZ = 100, rightX = 86.6, rightZ = 50;
    var spritePos = [frontX, frontZ, rightX, rightZ, rightX, -rightZ, frontX, -frontZ, -rightX, -rightZ, -rightX, rightZ];
    var scaleX = 100, scaleY = 100, scaleZ = 1;
    for(var child= 0, posIndex=0; child<images.length; ++child, posIndex+=2) {
        var texture = THREE.ImageUtils.loadTexture('images/'+images[child]);
        var spriteMaterial = new THREE.SpriteMaterial({
                useScreenCoordinates: false,
                map: texture}
        );
        var sprite = new THREE.Sprite(spriteMaterial);
        //Give sprite name
        sprite.name = 'sprite'+ child;
        sprite.scale.set(scaleX, scaleY, scaleZ);
        sprite.position.set(spritePos[posIndex], spriteHeight, spritePos[posIndex+1]);
        group.add(sprite);
    }

    group.position.set(pos.x, pos.y, pos.z);

    //Add audio tracks
    var audioObjects = [];
    for(var track=0; track<tracks.length; ++track) {
        audioObjects.push(new Sound('sound/'+tracks[track], pos, this.audioRadius, 1));
    }
    //audioObjects[0].play();
    //audioObjects[0].setVolume(0);
    group.audioObjects = audioObjects;
    group.currentTrack = -1;
    this.carousels.push(group);
    this.scene.add(group);
};

SoundApp.prototype.createGUI = function() {

};

/*
SoundApp.prototype.createAudio = function(source, radius, volume) {
    this.audio = document.createElement('audio');
    for(var i=0; i<source.length; ++i) {
        var src = document.createElement('source');
        src.src = source[i];
        this.audio.appendChild(src);
    }
    this.audioPosition = new THREE.Vector3();
    this.audioRadius = radius;
    this.audioVolume = volume;
};
*/

SoundApp.prototype.onKeyDown = function(event) {
    //DEBUG
    //console.log("Key pressed", event.keyCode);
    switch (event.keyCode) {
        case 67:
            this.animate = true;
            this.rotInc = Math.PI/3;
            break;
        case 80:
            console.log("CamPos=", this.controls.getObject().position);
            break;
        case 90:
            this.animate = true;
            this.rotInc = -Math.PI/3;
            break;
    }
};

SoundApp.prototype.onKeyUp = function(event) {
    //console.log("Key up", event.keyCode);
    switch (event.keyCode) {
        case 67:
            //this.animate = false;
            break;
    }
};

/*
function loaded() {
    alert("Everything loaded");
}
window.onload = loaded;
*/

//Only executed our code once the DOM is ready.
$(document).ready(function() {

    //Initialise app
    var container = document.getElementById("WebGL-output");
    var app = new SoundApp();
    app.init(container);
    //Keyboard callback
    $(document).keydown(function (event) {
        app.onKeyDown(event);
    });
    $(document).keyup(function (event) {
        app.onKeyUp(event);
    });
    app.createScene();
    app.createGUI();
    app.run();

});

