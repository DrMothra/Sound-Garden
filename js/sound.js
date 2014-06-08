/**
 * Created by DrTone on 28/05/2014.
 */

//Audio playback
var Sound = function(source, pos, radius, volume) {
    var audio = document.createElement('audio');
    var src = document.createElement('source');
    src.src = source;
    audio.appendChild(src);

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
    this.currentCar = 0;
    this.animationTime = 2;
    this.audioTrack = 0;
};

SoundApp.prototype.update = function() {
    //Perform any updates
    var delta = this.clock.getDelta();
    if(this.animate && !this.animating) {
        this.animating = true;
        this.animate = false;
        this.startRot = this.carousels[this.currentCar].rotation.y;
    }
    if(this.animating) {
        //DEBUG
        //console.log("Delta =", delta);
        this.carousels[this.currentCar].rotation.y += (delta/this.animationTime) * Math.PI/3;
        this.totalDelta += delta;
        if(this.totalDelta >= this.animationTime) {
            this.animating = false;
            this.totalDelta = 0;
            this.carousels[this.currentCar].rotation.y = this.startRot + Math.PI/3;
        }
    }
    //Play music when user nearby
    var currentTrack = this.audioObjects[this.audioTrack];
    var camPos = this.controls.getObject().position;
    for(var car=0; car<this.carousels.length; ++car) {
        var dist = this.carousels[car].position.distanceTo(camPos);
        if(dist <= this.audioRadius) {
            this.currentCar = car;
            var track = getNearestTrack(camPos, this.carousels[car]);
            currentTrack.pause();
            this.audioTrack = track;
            currentTrack = this.audioObjects[this.audioTrack];
            currentTrack.play();
            currentTrack.setVolume(currentTrack.getVolume() * (1-dist / currentTrack.getRadius()));
            break;
        } else {
            currentTrack.setVolume(0);
        }
    }

    //DEBUG
    //console.log("Volume =", this.audio.volume);

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

    //Create audio carousels
    //Rock carousel
    var images = ['soundgarden.jpg', 'alterbridge.jpg', 'blacksabbath.jpg', 'ledzeppelin.png', 'pearljam.jpg', 'foofighters.jpg'];
    var pos = new THREE.Vector3(450, 0, -450);
    this.createCarousel('rock', pos, images);
    images = ['mozart.jpg', 'beethoven.jpg', 'vivaldi.jpg', 'barber.jpg', 'chopin.jpg', 'bach.jpg'];
    pos.set(-450, 0, -450);
    this.createCarousel('classical', pos, images);
    var radius = 300;
    this.audioObjects = [];
    var tracks = ['sound/soundgarden.m4a', 'sound/alterbridge.mp3', 'sound/blacksabbath.m4a', 'sound/ledzeppelin.m4a', 'sound/pearljam.m4a', 'sound/foofighters.m4a'];
    for(var track=0; track<6; ++track) {
        this.audioObjects.push(new Sound(tracks[track], pos, radius, 1));
    }
    this.audioRadius = radius;
    this.audioObjects[this.audioTrack].play();
};

SoundApp.prototype.createCarousel = function(name, pos, tracks) {
    //Create group for carousel
    var group = new THREE.Object3D();
    group.name = name;
    //Create sprites for carousel
    var spriteHeight = 100;
    var frontX = 0, frontZ = 100, rightX = 86.6, rightZ = 50;
    var spritePos = [frontX, frontZ, rightX, rightZ, rightX, -rightZ, frontX, -frontZ, -rightX, -rightZ, -rightX, rightZ];
    var scaleX = 100, scaleY = 100, scaleZ = 1;
    for(var child= 0, posIndex=0; child<tracks.length; ++child, posIndex+=2) {
        var texture = THREE.ImageUtils.loadTexture('images/'+tracks[child]);
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
    //console.log("Key pressed", event.keyCode);
    switch (event.keyCode) {
        case 67:
            this.animate = true;
            break;
        case 80:
            console.log("CamPos=", this.controls.getObject().position);
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
