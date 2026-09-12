import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GeneratedPayload } from "../cad/messages";
import type { SerializedShape } from "../model/model";
import type { ModelParameters } from "../model/parameters";

const COLORS = {
  box: 0x4d4d49,
  lid: 0x247ba0,
  edges: 0x171717,
  grid: 0xa3a3a3,
} as const;

const VIEWER_LAYOUT = {
  lidOpenGap: 5,
  animationResponse: 8,
} as const;

export const DEFAULT_LID_CLOSED_FRACTION = 0.8;

export class ModelViewer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(36, 1, 0.1, 4000);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly modelGroup = new THREE.Group();
  private readonly resizeObserver: ResizeObserver;
  private lidPart: THREE.Group | null = null;
  private lidOpenX = 0;
  private lidTargetX = 0;
  private lidPosition = DEFAULT_LID_CLOSED_FRACTION;
  private previousFrameTime = 0;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = false;
    this.renderer.domElement.setAttribute("aria-label", "Interactive 3D preview");
    this.renderer.domElement.setAttribute("role", "img");
    container.appendChild(this.renderer.domElement);

    this.camera.up.set(0, 0, 1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 1400;

    this.scene.add(this.modelGroup);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x7a7a70, 2.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-150, -180, 260);
    this.scene.add(key);

    const grid = new THREE.GridHelper(700, 28, COLORS.grid, COLORS.grid);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.2;
    grid.material.opacity = 0.14;
    grid.material.transparent = true;
    this.scene.add(grid);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.applyTheme();
    this.render();
  }

  update(payload: GeneratedPayload, parameters: ModelParameters): void {
    this.clearModel();
    const box = this.createPart(payload.box, COLORS.box, 0.96);
    box.name = "BOX";
    const lid = this.createPart(payload.lid, COLORS.lid, 0.9);
    lid.name = "LID";
    this.lidOpenX = -(
      parameters.boxLength
      - parameters.lidWallThickness
      + VIEWER_LAYOUT.lidOpenGap
    );
    this.lidTargetX = this.lidOpenX * (1 - this.lidPosition);
    lid.position.set(this.lidTargetX, 0, 0);
    this.lidPart = lid;
    this.modelGroup.add(box, lid);
    this.frameModel();
  }

  setLidPosition(position: number): void {
    this.lidPosition = THREE.MathUtils.clamp(position, 0, 1);
    this.lidTargetX = this.lidOpenX * (1 - this.lidPosition);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches && this.lidPart) {
      this.lidPart.position.x = this.lidTargetX;
    }
  }

  applyTheme(): void {
    const background = getComputedStyle(document.documentElement)
      .getPropertyValue("--viewer-background")
      .trim();
    this.renderer.setClearColor(background || "#f5f5f5", 1);
  }

  resetCamera(): void {
    this.frameModel();
  }

  private createPart(data: SerializedShape, color: number, opacity: number): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(data.faces.vertices, 3));
    geometry.setIndex(data.faces.triangles);
    if (data.faces.normals.length === data.faces.vertices.length) {
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(data.faces.normals, 3));
    } else {
      geometry.computeVertexNormals();
    }
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.68,
      metalness: 0.02,
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(geometry, material));

    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(data.edges.lines, 3));
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: COLORS.edges,
      transparent: true,
      opacity: 0.46,
    });
    group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
    return group;
  }

  private frameModel(): void {
    if (this.modelGroup.children.length === 0) return;
    const bounds = new THREE.Box3().setFromObject(this.modelGroup);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z);
    this.controls.target.copy(center);
    this.camera.position.set(
      center.x + radius * 1.25,
      center.y - radius * 1.4,
      center.z + radius * 0.95,
    );
    this.camera.near = Math.max(0.1, radius / 1000);
    this.camera.far = radius * 15;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  private clearModel(): void {
    this.modelGroup.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.modelGroup.clear();
    this.lidPart = null;
  }

  private resize(): void {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private render = (time = 0): void => {
    const deltaSeconds = this.previousFrameTime === 0
      ? 0
      : Math.min((time - this.previousFrameTime) / 1000, 0.1);
    this.previousFrameTime = time;
    if (this.lidPart && Math.abs(this.lidPart.position.x - this.lidTargetX) > 0.01) {
      const blend = 1 - Math.exp(-VIEWER_LAYOUT.animationResponse * deltaSeconds);
      this.lidPart.position.x += (this.lidTargetX - this.lidPart.position.x) * blend;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  };
}
