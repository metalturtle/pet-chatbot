import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}`;

const fragmentShader = `
uniform float iTime;
uniform vec2 iResolution;
varying vec2 vUv;

vec4 N(float h) {
    return fract(sin(vec4(6.0,9.0,1.0,0.0)*h) * 9e2);
}

void main() {
    vec2 u = gl_FragCoord.xy/iResolution.y;
    float e, d, i=-2.0;
    vec4 o = vec4(0.0, 0.0, 0.0, 1.0);
    
    // Reduce iterations for better performance
    for(int j = 0; j < 5; j++) {
        i = float(j) - 2.0;
        d = floor(e = i*9.1+iTime);
        vec4 p = N(d)+0.3;
        e -= d;
        
        // Reduce inner loop iterations
        for(int k = 0; k < 20; k++) {
            float d = float(k);
            o.rgb += p.rgb*(1.0-e) / 1e3 / length(u-(p-e*(N(d*i)-0.5)).xy);
        }
    }
    
    if(u.y < N(ceil(u.x*i+d+e)).x*0.4) {
        o.rgb -= o.rgb*u.y;
    }
    
    // Add some base color and adjust alpha
    o.rgb = mix(vec3(0.1, 0.1, 0.15), o.rgb, 0.8);
    gl_FragColor = o;
}`;

export function createBackground() {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            iTime: { value: 0 },
            iResolution: { value: new THREE.Vector2() }
        },
        transparent: true,
        depthWrite: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false // Disable antialiasing for better performance
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
    
    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        material.uniforms.iResolution.value.set(width, height);
    }
    
    function animate(time) {
        material.uniforms.iTime.value = time * 0.0005; // Slow down the animation
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', resize);
    resize();
    animate(0);
    
    return renderer.domElement;
}
