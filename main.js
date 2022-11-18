import './style.css'

import * as THREE from 'three';

import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const score = document.querySelector('#score');
const health = document.querySelector('#health');

const modal = document.querySelector('#modal');
const big_score = document.querySelector('#big-score');
const start_button = document.querySelector('#start-button');
const end_button = document.querySelector('#end-button');

var animation_id;

let camera, scene, renderer;
let controls, water, sun;


let loader = new GLTFLoader();

// event listeners 'keyup' and 'keydown' for released and pressed keys
class Main_Boat {
  constructor() {
    loader.load("assets/boats/main_ship_lowpoly/scene.gltf", (gltf) => {
      // console.log(gltf);

      scene.add(gltf.scene);
      
      gltf.scene.scale.set(0.1, 0.1, 0.1);
      gltf.scene.position.set(0, 8, 0);
      gltf.scene.rotation.y = Math.PI;

      this.boat = gltf.scene;
      this.score = 0;
      this.health = 3;
      this.speed = {
        vel: 0,
        rot: 0
      };
    });
  }

  update() {
    if( this.boat ) {
      // console.log(this.boat.position);
      this.boat.translateZ(this.speed.vel); 
      this.boat.rotation.y += this.speed.rot;

      if(Math.max(this.boat.position.x, this.boat.position.z) >= 5000 || Math.min(this.boat.position.x, this.boat.position.z) <= -5000) {
        this.boat.position.x = 0;
        this.boat.position.z = 0;
      }
    }
  }
}


let main_boat;

class Pirate_Boat {
  constructor(_scene) {

    scene.add(_scene);
    
    _scene.scale.set(8, 8, 8);

    let x1 = rand(-2000, 2000) + main_boat.boat.position.x;
    while(x1 >= 5000 || x1 <= -5000) {
      x1 = rand(-2000, 2000) + main_boat.boat.position.x;
    }

    let z1 = rand(-2000, 2000) + main_boat.boat.position.z;
    while(z1 >= 5000 || z1 <= -5000) {
      z1 = rand(-2000, 2000) + main_boat.boat.position.z;
    }

    _scene.position.set(x1, -5, z1);
    _scene.rotation.y = 0;

    this.boat = _scene;
    this.score = 0;
    this.health = 3;
    this.speed = 2;
  }

  update() {
    var xd = new THREE.Vector3(main_boat.boat.position.x,main_boat.boat.position.y,main_boat.boat.position.z);
    var yd = new THREE.Vector3(this.boat.position.x,this.boat.position.y,this.boat.position.z);
    var dicks = this.boat.position.distanceTo(main_boat.boat.position);

    var subvec = new THREE.Vector3();
    subvec = subvec.subVectors(xd,yd);
     
    var hypotenuse = dicks;
    // console.log(hypotenuse);
   
    //1.5 stops it at 1.5 distance from the target planet
    // if(hypotenuse > 1.5){
    //   //console.log(hypotenuse);
    // }
    // else{
    //   //within fire range
    //   alert ("FIIIIIRE");
    // }

    this.boat.position.x += this.speed * (subvec.x/hypotenuse);
    this.boat.position.z += this.speed * (subvec.z/hypotenuse);
  }
}

let pirate_model = null;
async function create_pirate() {
  if(!pirate_model) {
    pirate_model = await load_model("assets/boats/pirate_ship_lowpoly/scene.gltf");
  }

  return new Pirate_Boat(pirate_model.clone());
}

let arr_pirate = [];
const pirate_count = 5;


class Treasure {
  constructor(_scene) {

    scene.add(_scene);
    
    _scene.scale.set(0.3, 0.3, 0.3);

    let x1 = rand(-1000, 1000) + main_boat.boat.position.x;
    while(x1 >= 5000 || x1 <= -5000) {
      x1 = rand(-1000, 1000) + main_boat.boat.position.x;
    }

    let z1 = rand(-1000, 1000) + main_boat.boat.position.z;
    while(z1 >= 5000 || z1 <= -5000) {
      z1 = rand(-1000, 1000) + main_boat.boat.position.z;
    }

    _scene.position.set(x1, -10, z1);
    _scene.rotation.y = 0;

    this.box = _scene;
  }
}

async function load_model(link) {
  return new Promise((resolve, reject) => {
    loader.load(link, (gltf) => {
      resolve(gltf.scene)
    });
  });
}


let treasure_model = null;
async function create_treasure() {
  if(!treasure_model) {
    treasure_model = await load_model("assets/treasure_chests/treasure_chest_lowpoly_2/scene.gltf");
  }

  return new Treasure(treasure_model.clone());
}

let arr_treasure = [];
const treasure_count = 5;


class Projectile {
  constructor(_scene) {

    scene.add(_scene);
    
    _scene.scale.set(3, 3, 3);

    const v1 = new THREE.Vector3(0, 0, 30).applyQuaternion(main_boat.boat.quaternion);
    _scene.quaternion.copy(main_boat.boat.quaternion);
    _scene.position.copy(main_boat.boat.position).add(v1.multiplyScalar(2));

    this.ball = _scene;
    this.speed = 5;
    this.dist = 0;
  }

  update() {
    if(this.dist <= 1000) {
      this.ball.translateZ(this.speed);
      this.dist += this.speed;
    }
    else {
      scene.remove(this.ball);
    }
  }
}

let cannon_ball_model = null;
async function create_cannon_ball() {
  if(!cannon_ball_model) {
    cannon_ball_model = await load_model("assets/cannon_ball_lowpoly/scene.gltf");
  }

  return new Projectile(cannon_ball_model.clone());
}

let cannon_ball;

class ThirdPersonCamera {
  constructor(camera, target) {
    this._camera = camera;
    this._target = target;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(-15, 70, -80);
    // const idealOffset = new THREE.Vector3(0, 0, 0);

    const temp = new THREE.Quaternion(this._target.rotation.x, this._target.rotation.y, this._target.rotation.z, 1);
    temp.normalize();

    idealOffset.applyQuaternion(temp); // Apply Quaternion
    idealOffset.add(this._target.position);
  

    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 10, 50);
    // const idealLookat = new THREE.Vector3(0, 0, 0);

    const temp = new THREE.Quaternion(this._target.rotation.x, this._target.rotation.y, this._target.rotation.z, 1);
    temp.normalize();

    idealLookat.applyQuaternion(temp); // Apply Quaternion
    idealLookat.add(this._target.position);  

    return idealLookat;
  }

  update() {
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    const t = 0.15;

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }
}


let third_person_camera;



start_button.addEventListener('click', function() {
  modal.style.display = 'none';
  init();
  animate();
});

end_button.addEventListener('click', function() {
  modal.style.display = 'none';
  location.reload();
});


// init();
// animate();

async function init() {

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild( renderer.domElement );

  //

  scene = new THREE.Scene();

  const fov = 55;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 1;
  const far = 20000;

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(30, 30, 100);

  // camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
  // camera.position.set( 30, 30, 100 );

  //

  sun = new THREE.Vector3();

  // Water

  const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load( 'assets/waters/waternormals.jpg', function ( texture ) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

      } ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = - Math.PI / 2;

  scene.add( water );

  // Skybox

  const sky = new Sky();
  sky.scale.setScalar( 10000 );
  scene.add( sky );

  const skyUniforms = sky.material.uniforms;

  skyUniforms[ 'turbidity' ].value = 10;
  skyUniforms[ 'rayleigh' ].value = 2;
  skyUniforms[ 'mieCoefficient' ].value = 0.005;
  skyUniforms[ 'mieDirectionalG' ].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator( renderer );

  var updateSun = (() => {

    const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
    const theta = THREE.MathUtils.degToRad( parameters.azimuth );

    sun.setFromSphericalCoords( 1, phi * 0.85, theta );

    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

    scene.environment = pmremGenerator.fromScene( sky ).texture;
  })();


  // Orbit controls

  // controls = new OrbitControls( camera, renderer.domElement );
  // controls.maxPolarAngle = Math.PI * 0.495;
  // controls.target.set( 0, 10, 0 );
  // controls.minDistance = 40.0;
  // controls.maxDistance = 200.0;
  // controls.update();

  const waterUniforms = water.material.uniforms;


  // global var initialization

  main_boat = new Main_Boat();

  for(let i = 0; i < treasure_count; i++) {
    const treasure = await create_treasure();
    arr_treasure.push(treasure);
  }

  for(let i = 0; i < pirate_count; i++) {
    const pirate = await create_pirate();
    arr_pirate.push(pirate);
  }

  third_person_camera = new ThirdPersonCamera(camera, main_boat.boat);

  //

  score.innerHTML = 0;
  big_score.innerHTML = 0;

  //

    
  // event listeners 'keyup' and 'keydown' for releasedvar animation_id; and pressed keys

  window.addEventListener( 'resize', onWindowResize );
  window.addEventListener( 'keydown', onKeyDown );
  window.addEventListener( 'keyup', onKeyUp );
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

// Generating a random number between min and max
function rand (min, max) {
  return Math.random() * (max - min) + min;
}

function onKeyDown (event) {
  // event.preventDefault();

  // console.log(event.key);

  if ( event.key == 'w' || event.key == 'ArrowUp' ) {
    main_boat.speed.vel = 2;
  }

  if ( event.key == 's' || event.key == 'ArrowDown' ) {
    main_boat.speed.vel = -2;
  }

  if ( event.key == 'a' || event.key == 'ArrowLeft' ) {
    main_boat.speed.rot = 0.02;
  }

  if ( event.key == 'd' || event.key == 'ArrowRight' ) {
    main_boat.speed.rot = -0.02;
  }
}

function onKeyUp (event) {
  // event.preventDefault();

  // console.log(event.key);

  if ( event.key == 'w' || event.key == 'ArrowUp' ) {
    main_boat.speed.vel = 0;
  }

  if ( event.key == 's' || event.key == 'ArrowDown' ) {
    main_boat.speed.vel = 0;
  }

  if ( event.key == 'a' || event.key == 'ArrowLeft' ) {
    main_boat.speed.rot = 0;
  }

  if ( event.key == 'd' || event.key == 'ArrowRight' ) {
    main_boat.speed.rot = 0;
  }

  if ( event.key == ' ') {
    if(!cannon_ball || cannon_ball.dist > 1000) {
      (async function() {
        cannon_ball = await create_cannon_ball();
      })();
      console.log('ball created');
    }
    else {
      console.log('ball already in scene');
    }
  }
}

function collision (obj1, obj2) {
  let distance = Math.sqrt(Math.pow(obj1.position.x - obj2.position.x, 2) + Math.pow(obj1.position.z - obj2.position.z, 2));

  if (distance < 30) {
    return true;
  } else {
    return false;
  }
}


function treasure_collision() {
  if(main_boat.boat) {
    arr_treasure.forEach( async function(treasure, index) {
      if(treasure.box) {
        if(collision(main_boat.boat, treasure.box)) {
          score.innerHTML = parseInt(score.innerHTML) + 50;
          scene.remove(treasure.box);
          arr_treasure[index] = await create_treasure();
        }
      }
    });
  }
}

function pirate_collision() {
  if(main_boat.boat) {

    arr_pirate.forEach( async function(pirate, index) {

      if(pirate.boat) {
        pirate.update();

        if(collision(main_boat.boat, pirate.boat)) {
          health.innerHTML = 0;
          scene.remove(pirate.boat);
          
          cancelAnimationFrame(animation_id);

          big_score.innerHTML = parseInt(score.innerHTML, 10);

          start_button.style.display = 'none';
          end_button.style.display = 'block';
          modal.style.display = "flex";
        }

        if(collision(cannon_ball.ball, pirate.boat)) {
          scene.remove(pirate.boat);
          arr_pirate[index] = await create_pirate();

          score.innerHTML = parseInt(score.innerHTML) + 10;

          cannon_ball.dist = 1001;
          scene.remove(cannon_ball.ball);
        }
      }
    });
  }
}

function animate() {

  animation_id = requestAnimationFrame( animate );

  if(third_person_camera && main_boat.boat) {
    third_person_camera.update();
  }

  if(main_boat.boat) {
    main_boat.update();
  }

  if(main_boat.boat) {
    treasure_collision();
  }

  if(main_boat.boat) {
    pirate_collision();
  }
  
  if(cannon_ball && cannon_ball.ball.parent == scene) {
    cannon_ball.update();
  }

  render();

}

function render() {

  const time = performance.now() * 0.001;

  water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

  renderer.render( scene, camera );
}
