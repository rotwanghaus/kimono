import getElementCenter from "../../../utils/getElementCenter";
import isTouchDevice from "../../../utils/isTouchDevice";
import BaseScene from "./BaseScene";
/*
 * Flow:
 * 1. this.animateSunrise() after imgs are laoded
 * 2. this.revealScene() when lotties are ready (= sun is up)
 * 3. this.animateParalax() for an eternity
 * */

class Scene extends BaseScene {
  vW: number;
  vH: number;
  paralaxDestination: { x: number; y: number };
  paralaxPosition: { x: number; y: number };
  isSunUp: boolean;
  sunPosition: number;
  sunEl: HTMLElement;
  onReady: () => void;

  constructor(appId: string, onReady?: () => void) {
    super(appId);
    this.paralaxDestination = { x: 0, y: 0 };
    this.paralaxPosition = { x: 0, y: 0 };
    this.isSunUp = false;
    this.sunPosition = 0;
    this.sunEl = null;
    this.vH = this.rootEl.clientHeight;
    this.vW = this.rootEl.clientWidth;
    this.attachListeners();
    this.onMouseMove();
    this.addEventListener("static_assets_loaded", () => {
      this.animateSunRise();
    });
    this.onReady = onReady;
  }

  attachListeners() {
    window.addEventListener("resize", () => {
      this.vH = this.rootEl.clientHeight;
      this.vW = this.rootEl.clientWidth;
    });
  }

  async revealScene() {
    const staggeredScene = this.loadedSceneItems.items.map((item, i) => {
      return new Promise((res) => {
        setTimeout(() => {
          item.classList.add("reveal");
          res("");
        }, i * 150);
      });
    });

    Promise.all(staggeredScene).then(() => {
      this.onReady();
      this.animateParalax();
    });
  }

  sunrise() {
    const sunTarget =
      this.sceneItemsCount.total / this.loadedSceneItems.items.length;
    const distance = sunTarget - this.sunPosition;
    const step = 0.01;
    this.sunPosition += distance * step;
    const sunEl = this.loadedSceneItems.static.find(
      (item) => item.dataset.name === "sun",
    );
    // const sunPath = sunEl.querySelector("path");
    // const { x, y } = getElementCenter(sunPath);

    sunEl.style.transform = `translateY(${60 * (1 - this.sunPosition)}%)`;
    this.isSunUp = this.sunPosition >= 0.99;

    if (this.isSunUp) {
      this.revealScene();
    }
  }

  paralax() {
    const distX = this.paralaxDestination.x - this.paralaxPosition.x;
    const distY = this.paralaxDestination.y - this.paralaxPosition.y;
    const vWhalf = this.vW / 2;
    const step = 0.05;
    this.paralaxPosition.x += distX * step;
    this.paralaxPosition.y += distY * step;

    this.loadedSceneItems.items.forEach((item) => {
      const paralaxAmount = Number(item.dataset.paralaxAmount);
      const paralaxDistance = paralaxAmount * 100;

      const path = item.querySelector("path");
      const { x: pathX } = getElementCenter(path);
      const paralaxPositionX = this.paralaxPosition.x * paralaxDistance;
      const paralaxPositionY = this.paralaxPosition.y * paralaxDistance;
      const pathCenterXNorm = (pathX - vWhalf) / vWhalf;
      const scale =
        1 - pathCenterXNorm * this.paralaxPosition.x * 0.2 * -1 * paralaxAmount;

      item.style.transform = `
        rotateY(${this.paralaxPosition.x * 2}deg)
        rotateX(${-1 * this.paralaxPosition.y * 2}deg)
        scale(${scale})
        translate(${paralaxPositionX}px, ${paralaxPositionY}px)
      `;
    });
  }

  animateParalax() {
    function raf() {
      this.paralax();
      window.requestAnimationFrame(raf.bind(this));
    }
    window.requestAnimationFrame(raf.bind(this));
  }

  animateSunRise() {
    function raf() {
      this.sunrise();
      if (this.isSunUp) return;
      window.requestAnimationFrame(raf.bind(this));
    }
    window.requestAnimationFrame(raf.bind(this));
  }

  onMouseMove() {
    if (isTouchDevice()) return;
    function handleMouseMove(e: MouseEvent) {
      const w = this.rootEl.clientWidth;
      const h = this.rootEl.clientHeight;
      const x = e.clientX;
      const y = e.clientY;
      const normX = (x - w / 2) / (w / 2);
      const normY = (y - h / 2) / (h / 2);
      this.paralaxDestination = { x: normX, y: normY };
    }
    this.rootEl.addEventListener("mousemove", handleMouseMove.bind(this));
  }
}

export default Scene;
