let camera, scene, renderer; // ThreeJS
let world; // CannonJs 
let lastTime; // Pēdējās animācijas laaiks
let tower; // Torņa gabali

let ended;//Vai spēle ir beigusies
let overhangs; // Pārpalikumi, kad torņa gabals ir pāri otram
const towerHeight = 0.5; // torņa gabala lielums
const originTowerSize = 2; // Orģinālais torņa gabala lielums


//Paņem no html faila score , kuram skaita klāt, kad pieliek torņa gabalu
const scoring = document.getElementById("score");


init();

function init() {

  ended = true;
  lastTime = 0;
  tower = [];
  overhangs = [];


  // Izveido cannon pasauli
  world = new CANNON.World();
  world.gravity.set(0, -100, 0); //pasaulei pieliek gravitāciju
  
  // Izveido three.js lietas
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;

    //Kameras pozīcija
  camera = new THREE.OrthographicCamera(
    width / -2, // Cik tālu no kreisās
    width / 2, // Cik tālu no labās
    height / 1, // Cik tālu no Augšas
    height / -1, // Cik tālu no Lejas
    0, // Cik tālu no tuvās plaknes
    100 // Cik tālu no tālās plaknes
  );


  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  // Sākuma
  addLayer(0, 0, originTowerSize, originTowerSize);


  // Gaismas
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.65);
  directionalLight.position.set(13, 15, 5);
  scene.add(directionalLight);

  // Renderers
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  renderer.setClearColor( 0xffffff, 0); //transparent background
  document.body.appendChild(renderer.domElement);
  
}

function start() {
  
  ended = false;
  lastTime = 0;
  tower = [];
  overhangs = [];

  if (scoring) scoring.innerText = 0;

  if (world) {
    // Noņem objektus
    while (world.bodies.length > 0) {
      world.remove(world.bodies[0]);
    }
  }

  if (scene) {
    // Noņem meshus no scēnas
    while (scene.children.find((c) => c.type == "Mesh")) {
      const mesh = scene.children.find((c) => c.type == "Mesh");
      scene.remove(mesh);
    }

    // Sākuma
    addLayer(0, 0, originTowerSize, originTowerSize);

    // Pirmais
    addLayer(-10, 0, originTowerSize, originTowerSize, "x");
  }

  if (camera) {
    // Atliek kameras pozīciju
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }
}

function addLayer(x, z, width, depth, direction) {
  const y = towerHeight * tower.length; // Pievieno torņa gabalu vienu augstāk
  const layer = generateTowerBlock(x, y, z, width, depth, false);
  layer.direction = direction;
  tower.push(layer);
}

function cutBox(topLayer, overlap, size, delta) {
  const direction = topLayer.direction;
  const newWidth = direction == "x" ? overlap : topLayer.width;
  const newDepth = direction == "z" ? overlap : topLayer.depth;

  // Atjauno torņa proporcijas
  topLayer.width = newWidth;
  topLayer.depth = newDepth;

  // Atjauno Three js modeli
  topLayer.threejs.scale[direction] = overlap / size;
  topLayer.threejs.position[direction] -= delta / 2;
}

window.addEventListener("mousedown", eventHandler);

function eventHandler() {
  if (ended) start();
  else splitAndAdd();
}
function missed() {
  const topLayer = tower[tower.length - 1];
  ended = true;
}
function addOverhang(x, z, width, depth) {
  const y = towerHeight * (tower.length - 1); // Pievieno torņa gabalu tajā pašā virsmā
  const overhang = generateTowerBlock(x, y, z, width, depth, true);
  overhangs.push(overhang);
}
function splitAndAdd() {
  if (ended) return;

  const topLayer = tower[tower.length - 1];
  const previousLayer = tower[tower.length - 2];

  const direction = topLayer.direction;

  const size = direction == "x" ? topLayer.width : topLayer.depth;
  const delta = topLayer.threejs.position[direction] - previousLayer.threejs.position[direction];
  const overhangSize = Math.abs(delta);
  const overlap = size - overhangSize;

  if (overlap > 0) {
    cutBox(topLayer, overlap, size, delta);

    // Overhang
    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const overhangX =direction == "x" ? topLayer.threejs.position.x + overhangShift: topLayer.threejs.position.x;
    const overhangZ =direction == "z" ? topLayer.threejs.position.z + overhangShift: topLayer.threejs.position.z;
    const overhangWidth = direction == "x" ? overhangSize : topLayer.width;
    const overhangDepth = direction == "z" ? overhangSize : topLayer.depth;

    addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

    // Nākošais slānis
    const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
    const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
    const newWidth = topLayer.width;
    const newDepth = topLayer.depth; 
    const nextDirection = direction == "x" ? "z" : "x";

    if (scoring) scoring.innerText = tower.length - 1;
    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
  } else {
    missed();
  }
}
function generateTowerBlock(x, y, z, width, depth, falls) {
  // ThreeJS
  const geometry = new THREE.BoxGeometry(width, towerHeight, depth);
  const color = new THREE.Color(`hsl(${0 + tower.length * 7}, 90%, 60%)`);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  // CannonJS
  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, towerHeight / 2, depth / 2)
  );
  let mass = falls ? 1 : 0; // ja nevajag krist, tad padara stacionāru ar masu 0
  mass *= width / originTowerSize; // masa proporcionāla lielumam
  mass *= depth / originTowerSize; // masa proporcionāla lielumam
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);
 
  return {
    threejs: mesh,
    cannonjs: body,
    width,
    depth
  };
}




function updatePhysics(timePassed) {
  world.step(timePassed / 2300); 

  // kopē kooridnātes Cannon.js uz Three.js
  overhangs.forEach((element) => {
    element.threejs.position.copy(element.cannonjs.position);
    element.threejs.quaternion.copy(element.cannonjs.quaternion);
  });
}
function animation(time) {
  if (lastTime) {
    const timePassed = time - lastTime;
    const speed = 0.008;

    const topLayer = tower[tower.length - 1];
    const previousLayer = tower[tower.length - 2];

    const shouldMove = !ended

    if (shouldMove) {
      // Savieno laikus Vizuālajā pozīcijā un pozīciju modelī
      topLayer.threejs.position[topLayer.direction] += speed * timePassed;
      topLayer.cannonjs.position[topLayer.direction] += speed * timePassed;

      // Ja palaida torņa gabalu garām, tad uzskaita par palaistu garām
      if (topLayer.threejs.position[topLayer.direction] > 10) {
        missed();
      }
    } else {
    }

    // origīnālais kameras augstums
    if (camera.position.y < towerHeight * (tower.length - 2) + 5) {
      camera.position.y += speed * timePassed;
    }

    updatePhysics(timePassed);
    renderer.render(scene, camera);
  }
  lastTime = time;
}
