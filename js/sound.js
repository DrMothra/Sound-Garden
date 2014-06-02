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
    this.group = new THREE.Object3D();
};

SoundApp.prototype.update = function() {
    //Perform any updates
    BaseApp.prototype.update.call(this);
    this.group.rotation.y += 0.1;
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

    //Create sprites for carousel
    var spriteMaterial = new THREE.SpriteMaterial({
            color: 0x0000ff,
            //transparent: false,
            useScreenCoordinates: false,
            map: texture}
    );

    var sprite = new THREE.Sprite(spriteMaterial);
    var scaleX = 100;
    var scaleY = 100;

    sprite.scale.set(scaleX, scaleY, 100);
    sprite.position.set(60, 120, 0);

    this.group.add(sprite);

    //Give sprite a name
    //sprite.name = "Sprite" + this.spritesRendered++;

    //this.scene.add(sprite);

    sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(scaleX, scaleY, 100);
    sprite.position.set(-60, 120, 0);

    this.group.add(sprite);

    this.scene.add(this.group);
};

SoundApp.prototype.createGUI = function() {

};

//Only executed our code once the DOM is ready.
$(document).ready(function() {

    //Initialise app
    var container = document.getElementById("WebGL-output");
    var app = new SoundApp();
    app.init(container);
    app.createScene();
    app.createGUI();
    app.run();

});