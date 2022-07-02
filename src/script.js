/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui'
import { ShadowMapViewer } from 'three/examples/jsm/utils/ShadowMapViewer.js';



//SIZE
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/////////////////////////////////////////////////////////////////////////
//// DRACO LOADER TO LOAD DRACO COMPRESSED MODELS FROM BLENDER
const dracoLoader = new DRACOLoader()
const loader = new GLTFLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
dracoLoader.setDecoderConfig({ type: 'js' })
loader.setDRACOLoader(dracoLoader)

/////////////////////////////////////////////////////////////////////////
///// DIV CONTAINER CREATION TO HOLD THREEJS EXPERIENCE
const container = document.createElement('div')
document.body.appendChild(container)

/////////////////////////////////////////////////////////////////////////
///// SCENE CREATION
const scene = new THREE.Scene()
scene.background = new THREE.Color('#ffffff')
scene.fog = new THREE.Fog('#ffffff', 1, 300)

/////////////////////////////////////////////////////////////////////////
///// RENDERER CONFIG
const renderer = new THREE.WebGLRenderer({ antialias: true }) // turn on antialias
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //set pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight) // make it full screen
renderer.outputEncoding = THREE.sRGBEncoding // set color encoding
renderer.shadowMap.enable = true
container.appendChild(renderer.domElement) // add the renderer to html div

/////////////////////////////////////////////////////////////////////////
///// CAMERAS CONFIG
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000)
camera.position.set(-100, 50, 86)
camera.autoRotate = true
camera.lookAt(50, 0, 150)
scene.add(camera)

/////////////////////////////////////////////////////////////////////////
///// MAKE EXPERIENCE FULL SCREEN
window.addEventListener('resize', () => {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    renderer.setPixelRatio(2)
})

/////////////////////////////////////////////////////////////////////////
///// CREATE ORBIT CONTROLS
const controls = new MapControls(camera, renderer.domElement);
controls.enableDamping = true
controls.screenSpacePanning = false
controls.minDistance = 25
controls.maxDistance = 50
controls.maxPolarAngle = Math.PI / 2.5
controls.MinPolarAngle = Math.PI / 2.5 - 0.2

//TEST PLANE
// const geometry = new THREE.PlaneGeometry(1000, 1000);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
// const plane = new THREE.Mesh(geometry, material);
// plane.rotation.x = Math.PI / 2
// plane.position.y = -10
// plane.receiveShadow = true
// scene.add(plane);

/////////////////////////////////////////////////////////////////////////
///// SCENE LIGHTS
const ambient = new THREE.AmbientLight(0xa0a0fc, 0.82)
scene.add(ambient)

const sunLight = new THREE.DirectionalLight(0xe8c37b, 1.96)
sunLight.position.set(69, 44, 14)
sunLight.target.position.set(0, 0, 0)
sunLight.castShadow = true;
scene.add(sunLight)

/////////////////////////////////////////////////////////////////////////
///// LOADING GLB/GLTF MODEL FROM BLENDER
let mixer
const points = []
const raycaster = new THREE.Raycaster()
loader.load('models/gltf/untitled.gltf', function(gltf) {
    console.log(gltf)
    scene.add(gltf.scene)

    //shadow scene
    const sha1 = gltf.scene.children
    sha1[37].castShadow = true
    sha1[84].castShadow = true
    sha1[30].receiveShadow = true

    //shadow scenes
    const sha2 = gltf.scenes[0].children
    sha2[37].castShadow = true
    sha2[84].castShadow = true
    sha2[30].receiveShadow = true

    //position of points
    const temp = gltf.scene.children
    for (let i = 44; i <= 65; i++) {
        let t = i - 44
        points.push({
            position: new THREE.Vector3(temp[i].position.x, temp[i].position.y, temp[i].position.z),
            element: document.querySelector('.point-' + `${t}`)
        })
    }

    //animation
    mixer = new THREE.AnimationMixer(gltf.scene)
    const clips = gltf.animations
    clips.forEach(function(clip) {
        const action = mixer.clipAction(clip)
        action.play()
    })
})

/////////////////////////////////////////////////////////////////////////
//// INTRO CAMERA ANIMATION USING TWEEN
// function introAnimation() {
//     controls.enabled = false //disable orbit controls to animate the camera

//     new TWEEN.Tween(camera.position.set(26, 4, -35)).to({ // from camera position
//             x: 16, //desired x position to go
//             y: 100, //desired y position to go
//             z: -0.1 //desired z position to go
//         }, 6500) // time take to animate
//         .delay(1000).easing(TWEEN.Easing.Quartic.InOut).start() // define delay, easing
//         .onComplete(function() { //on finish animation
//             controls.enabled = true //enable orbit controls
//             setOrbitControlsLimits() //enable controls limits
//             TWEEN.remove(this) // remove the animation from memory
//         })
// }

//introAnimation() // call intro animation on start

/////////////////////////////////////////////////////////////////////////
//// DEFINE ORBIT CONTROLS LIMITS
// function setOrbitControlsLimits() {
//     controls.enableDamping = true
//     controls.dampingFactor = 0.04
//     controls.minDistance = 35
//     controls.maxDistance = 60
//     controls.enableRotate = true
//     controls.enableZoom = true
//     controls.maxPolarAngle = Math.PI / 2.5
// }

/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION



//DEBUG
const gui = new dat.GUI()
gui.add(camera.position, 'x').min(-100).max(200).step(1)
gui.add(camera.position, 'y').min(-100).max(200).step(1)
gui.add(camera.position, 'z').min(-100).max(200).step(1)

const clock = new THREE.Clock()

function rendeLoop() {
    if (mixer) {
        mixer.update(clock.getDelta())
    }
    TWEEN.update() // update animations
    controls.update() // update orbit controls
    for (const point of points) {
        // Get 2D screen position
        const screenPosition = point.position.clone()
        screenPosition.project(camera)

        // Set 3D screen position
        point.element.classList.add('visible')
        const translateX = screenPosition.x * sizes.width * 0.5
        const translateY = -screenPosition.y * sizes.height * 0.5
        point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
    }
    renderer.render(scene, camera) // render the scene using the camera

    requestAnimationFrame(rendeLoop) //loop the render function

}

rendeLoop() //start rendering