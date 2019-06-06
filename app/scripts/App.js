import * as THREE from 'three'
import Sound from './Sound.js';
import Audio from '../assets/kool.mp3';
import OBJLoader from './OBJLoader';
import ObjetHeart from '../assets/model/Heart.obj';
import {
    TweenMax,
} from 'gsap';
import SimplexNoise from 'simplex-noise';

import 'three/examples/js/postprocessing/EffectComposer';
import 'three/examples/js/postprocessing/RenderPass';
import 'three/examples/js/postprocessing/ShaderPass';
import 'three/examples/js/shaders/CopyShader'
import 'three/examples/js/shaders/DotScreenShader'
import 'three/examples/js/shaders/LuminosityHighPassShader';
import 'three/examples/js/postprocessing/UnrealBloomPass';

let composer
let params = {
    exposure: 1,
    bloomStrength: 0.45,
    bloomThreshold: 0,
    bloomRadius: 1
};

export default class App {

    constructor() {

        this.simplex = new SimplexNoise()

        //START TIME FOR DELTA TIME
        this.startTime = Date.now() / 100

        //MATERIAL
        this.material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.common,
                THREE.UniformsLib.specularmap,
                THREE.UniformsLib.envmap,
                THREE.UniformsLib.aomap,
                THREE.UniformsLib.lightmap,
                THREE.UniformsLib.emissivemap,
                THREE.UniformsLib.fog,
                THREE.UniformsLib.lights,
                {
                    emissive: {
                        value: new THREE.Color(0x000000)
                    },
                    time: {
                        type: "f",
                        value: 0
                    },
                    sound: {
                        type: "f",
                        value: 0
                    }
                }
            ]),
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: THREE.ShaderChunk.meshlambert_frag,
            lights: true
        });
        this.material.flatShading = true;
        this.heart = null

        //Audio
        this.src = Audio
        this.audio = new Sound(Audio, 103, .3, () => {
            this.audio._load(Audio, () => {
                this.audio.play()
            })
        }, false);

        this.container = document.querySelector('#three');
        document.body.appendChild(this.container);

        //Camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 250

        this.scene = new THREE.Scene();

        //Light
        var lightFront = new THREE.DirectionalLight(0xDD587F, 1);
        lightFront.position.set(0, 0, 100);
        // var lightMiddle = new THREE.PointLight(0xff0000, 1000, 10000);
        // lightMiddle.position.set(0, 0, 0);
        var lightBack = new THREE.DirectionalLight(0xDD587F, 1);
        lightBack.position.set(0, 0, -100);
        var lightAmbiant = new THREE.AmbientLight(0x404040);
        this.scene.add(lightFront, lightBack, lightAmbiant);

        //Import and Create Object
        var objLoader = new OBJLoader();
        objLoader.load(ObjetHeart, object => {
            this.heart = object.children[0] //Variable objet Heart
            object.children[0].material = this.material //Variable HeartMaterial
            this.scene.add(object);
        });

        window.addEventListener("mousemove", onmousemove, false);

        let self = this

        function onmousemove(event) {
            let mouseX = (event.clientX / window.innerWidth) * 0.8;
            let mouseY = (event.clientY / window.innerHeight) * 0.8;
            self.heart.rotation.x = mouseY
            self.heart.rotation.y = mouseX

        }

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.onWindowResize();

        var renderScene = new THREE.RenderPass(this.scene, this.camera);
        var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.renderToScreen = true;
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;
        composer = new THREE.EffectComposer(this.renderer);
        composer.setSize(window.innerWidth, window.innerHeight);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        this.renderer.animate(this.render.bind(this));
    }

    render() {
        this.time = Date.now() / 100 - this.startTime
        this.sound = this.audio.frequencyDataArray[1] * Math.cos(Math.random() * 0.5)


        if (this.heart) {
            this.material.uniforms['time'].value = this.time
            this.material.uniforms['sound'].value = this.sound

            this.heart.scale.x = 1

            if (this.audio.frequencyDataArray[1] >= 220) {

                TweenMax.to(params, 0.5, {
                    bloomStrength: 3,
                    ease: Expo.easeOut
                });

            } else {
                TweenMax.to(params, 0.5, {
                    bloomStrength: 0,

                    ease: Expo.easeOut
                });
            }

            TweenMax.from(this.heart.scale, 5, {
                z: 1 + (Math.abs(this.simplex.noise2D(this.audio.frequencyDataArray[1] / this.time, 10)) / 4),
                x: 1 + (Math.abs(this.simplex.noise2D(this.audio.frequencyDataArray[1] / this.time, 10)) / 4),
                y: 1 + (Math.abs(this.simplex.noise2D(this.audio.frequencyDataArray[1] / this.time, 10)) / 4),
                ease: Expo.easeOut
            });

        }

        //this.renderer.render(this.scene, this.camera);
        composer.render();

    }

    onWindowResize() {
        this.camera
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}