"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function Product3DViewer({ modelUrl, frontTexture, backTexture, productName }) {
  const hostRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !modelUrl) return undefined;

    let disposed = false;
    let frameId = 0;
    let modelRoot = null;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f6f6f6");
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
    camera.position.set(0, 0.15, 4.4);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setError(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.domElement.setAttribute("aria-label", `Modèle 3D de ${productName}`);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;outline:none";
    renderer.domElement.tabIndex = 0;
    host.replaceChildren(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x77717d, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-3, 5, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xd9d3ff, 1.1);
    fillLight.position.set(4, 1, -4);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 6;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.addEventListener("start", () => { controls.autoRotate = false; });

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const textureRequests = [];
    if (frontTexture) textureRequests.push(["front", frontTexture]);
    if (backTexture) textureRequests.push(["back", backTexture]);

    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        modelRoot = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(modelRoot);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.35 / maxAxis;
        modelRoot.scale.setScalar(scale);
        modelRoot.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        scene.add(modelRoot);
        controls.target.set(0, 0, 0);
        controls.update();

        for (const [side, url] of textureRequests) {
          textureLoader.load(url, (texture) => {
            if (disposed || !modelRoot) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            modelRoot.traverse((object) => {
              if (!object.isMesh || !object.material) return;
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              for (const material of materials) {
                if (String(material.name || "").toLowerCase().includes(side) && material.map) {
                  material.map = texture;
                  material.needsUpdate = true;
                }
              }
            });
          }, undefined, () => setError(true));
        }
      },
      undefined,
      () => { if (!disposed) setError(true); },
    );

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || !host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    });
    resizeObserver.observe(host);

    const animate = () => {
      if (disposed) return;
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      modelRoot?.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [modelUrl, frontTexture, backTexture, productName]);

  return (
    <div className="absolute inset-0 bg-[#f6f6f6]">
      <div ref={hostRef} className="h-full w-full" />
      {error ? (
        <div className="absolute inset-x-3 top-3 rounded-xl bg-white/90 px-3 py-2 text-center text-xs text-red-600 shadow-sm">
          Le modèle 3D n’a pas pu être chargé.
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-apple-mid shadow-sm">
          Faites glisser pour tourner
        </div>
      )}
    </div>
  );
}
