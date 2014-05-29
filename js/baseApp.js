/**
 * Created by atg on 14/05/2014.
 */
//Common baseline for visualisation app

function BaseApp() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.container = null;
    this.projector = null;
    this.objectList = [];
    this.root = null;
    this.mouse = { x:0, y:0, clicked:false};
    this.pickedObjects = [];
    this.startTime = 0;
    this.elapsedTime = 0;
    this.clock = new THREE.Clock();
}

BaseApp.prototype.init = function(container) {
    this.container = container;
    console.log("BaseApp container =", container);
    this.createRenderer();
    console.log("BaseApp renderer =", this.renderer);
    this.createCamera();
    //this.initMouse();
    this.createControls();
    this.projector = new THREE.Projector();
}

BaseApp.prototype.createRenderer = function() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColorHex(0xafafaf, 1.0);
    //this.renderer.setSize(1024, 768);
    //this.renderer.shadowMapEnabled = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild( this.renderer.domElement );
};

BaseApp.prototype.createScene = function() {
    this.scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0x383838);
    this.scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xaaaaaa);
    directionalLight.position.set(60, 60, 60);
    directionalLight.distance = 0;
    directionalLight.intensity = 0.5;
    this.scene.add(directionalLight);

    this.scene.add( this.controls.getObject() );
};

BaseApp.prototype.createCamera = function() {
    /*
    offsetLeft = this.container.offsetLeft;
    offsetTop = this.container.offsetTop;
    offsetWidth = this.container.offsetWidth;
    offsetHeight = this.container.offsetHeight;
    */
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000 );
    this.camera.position.set( 0, 0, 150 );

    console.log('dom =', this.renderer.domElement);
}

BaseApp.prototype.createControls = function() {
    /*
    //Trackball controls
    this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 1.0;

    this.controls.noZoom = false;
    this.controls.noPan = false;

    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;

    this.controls.keys = [ 65, 83, 68 ];

    var self = this;
    */
    //Pointer lock controls

    var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

    var self = this;
    if(havePointerLock) {
        var lockElement = document.body;

        var pointerlockchange = function (event) {
            console.log("Pointer lock change");
            if ( document.pointerLockElement === lockElement || document.mozPointerLockElement === lockElement || document.webkitPointerLockElement === lockElement) {
                self.controls.enabled = true;
            } else {
                self.controls.enabled = false;
            }
        };
        var pointerlockerror = function (event) {
            console.log("Pointer lock error");
        };

        document.addEventListener('pointerlockchange', pointerlockchange, false);
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

        document.addEventListener('pointerlockerror', pointerlockerror, false);
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

        //Lock screen when button pressed
        var start = document.getElementById("start");
        start.addEventListener( 'click', function ( event ) {
            lockElement.requestPointerLock = lockElement.requestPointerLock || lockElement.mozRequestPointerLock || lockElement.webkitRequestPointerLock;
            console.log("Lock element =", lockElement.requestPointerLock);
            lockElement.requestPointerLock();
        });

    } else {
        alert("Pointer lock not supported");
    }

    //Create pointer lock controls
    this.controls = new THREE.PointerLockControls(this.camera);
}

BaseApp.prototype.update = function() {
    //Do any updates
    this.controls.update();
}

BaseApp.prototype.run = function(timestamp) {
    //Calculate elapsed time
    if (this.startTime === null) {
        this.startTime = timestamp;
    }
    this.elapsedTime = timestamp - this.startTime;

    this.renderer.render( this.scene, this.camera );
    var self = this;
    this.update();
    requestAnimationFrame(function(timestamp) { self.run(timestamp); });
}