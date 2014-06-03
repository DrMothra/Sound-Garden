/**
 * Created by DrTone on 28/05/2014.
 */

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
    this.group = new THREE.Object3D();
    this.animationTime = 2;
};

SoundApp.prototype.update = function() {
    //Perform any updates
    var delta = this.clock.getDelta();
    if(this.animate && !this.animating) {
        this.animating = true;
        this.animate = false;
        this.startRot = this.group.rotation.y;
    }
    if(this.animating) {
        //DEBUG
        //console.log("Delta =", delta);
        this.group.rotation.y += (delta/this.animationTime) * Math.PI/3;
        this.totalDelta += delta;
        if(this.totalDelta >= this.animationTime) {
            this.animating = false;
            this.totalDelta = 0;
            this.group.rotation.y = this.startRot + Math.PI/3;
        }
    }
    //Update sounds
    var dist = this.position.distanceTo(this.controls.getObject().position);
    //DEBUG
    //console.log("dist =", dist);
    if(dist <= this.radius) {
        this.audio.volume = this.volume * (1-dist / this.radius);
    } else {
        this.audio.volume = 0;
    }
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
    var geometry = new THREE.PlaneGeometry( 1500, 1500, this.worldWidth-1, this.worldDepth-1);
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    for ( var i = 0; i < geometry.vertices.length; i ++ ) {
        geometry.vertices[ i ].y = data[ i ] * 1.25;
    }

    var texture = THREE.ImageUtils.loadTexture("images/sand_texture1013.jpg");
    var material = new THREE.MeshPhongMaterial({map : texture});

    var mesh = new THREE.Mesh( geometry, material);
    this.scene.add(mesh);

    this.createCarousel("images/autumn.jpg");
    this.createSound(['sound/soundgarden.m4a'], 200, 1);
    this.position.set(0, 0, 0);
    this.audio.play();
};

SoundApp.prototype.createCarousel = function(textureName) {
    //Create sprites for carousel
    var textureNames = ['soundgarden.jpg', 'alterbridge.jpg', 'blacksabbath.jpg', 'ledzeppelin.png', 'pearljam.jpg', 'foofighters.jpg'];
    var spritesPerCarousel = 6;
    var spriteHeight = 100;
    var frontX = 0, frontZ = 100, rightX = 86.6, rightZ = 50;
    var spritePos = [frontX, frontZ, rightX, rightZ, rightX, -rightZ, frontX, -frontZ, -rightX, -rightZ, -rightX, rightZ];
    var scaleX = 100, scaleY = 100, scaleZ = 1;
    for(var child= 0, pos=0; child<spritesPerCarousel; ++child, pos+=2) {
        var texture = THREE.ImageUtils.loadTexture('images/'+textureNames[child]);
        var spriteMaterial = new THREE.SpriteMaterial({
                useScreenCoordinates: false,
                map: texture}
        );
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(scaleX, scaleY, scaleZ);
        sprite.position.set(spritePos[pos], spriteHeight, spritePos[pos+1]);
        this.group.add(sprite);
    }

    this.scene.add(this.group);
};

SoundApp.prototype.createGUI = function() {

};

SoundApp.prototype.createSound = function(source, radius, volume) {
    this.audio = document.createElement('audio');
    for(var i=0; i<source.length; ++i) {
        var src = document.createElement('source');
        src.src = source[i];
        this.audio.appendChild(src);
    }
    this.position = new THREE.Vector3();
    this.radius = radius;
    this.volume = volume;
};

SoundApp.prototype.onKeyDown = function(event) {
    //console.log("Key pressed", event.keyCode);
    switch (event.keyCode) {
        case 67:
            this.animate = true;
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
    $(document).keydown(function(event) {
        app.onKeyDown(event);
    });
    $(document).keyup(function(event) {
        app.onKeyUp(event);
    });
    app.createScene();
    app.createGUI();
    app.run();

});