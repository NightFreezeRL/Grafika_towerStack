
let camera, scene, renderer;
const originalBoxSize = 3;
function init() {
    let camera, scene, renderer;
    const originalBoxSize = 3;
    const scene = new THREE.Scene();

    addLayer(0, 0, originalBoxSize, originalBoxSize);
    addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");


    const ambientLight = new THREE.ambientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.directionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 0);
    scene.add(directionalLight);

    const width = 10;
    const windowW = window.innerHeight;
    const windowH = window.innerHeight;

    const height = width * (windowW / windowH);
    const camera = new THREE.OrthographicCamera(
        width / -2,
        width / 2,
        height / 2,
        height / -2,
        1,
        100

    );
    camera.position.set(4, 4, 4);
    camera.lookAAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(windowW / windowH);
    renderer.render(scene, camera);
    document.body.appendChild(renderer.domElement);


}
let stack = [];
const boxHeight = 1;
function addLayer(x, z, width, depth, direction) {
    const y = boxHeight * stack.length;

    const layer = generateBox(x, y, z, width, depth);
    layer.direction = direction;
    stack.push(layer)
}
function generateBox(x, y, z, width, depth) {
    const geometry = Three.BoxGeometry(width, boxHeight, depth);
    const color = new THREE.Color('hsl(${30 + stack.length * 4}, 100% ,50%)')
    const material = Three.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    return {
        threejs: mesh,
        width,
        depth,
    };
}