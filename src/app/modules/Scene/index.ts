import { Config } from "../../../consts/config";
import getElementCenter from "../../../utils/getElementCenter";
import isTouchDevice from "../../../utils/isTouchDevice";
import BaseScene from "./BaseScene";
/*
 *
 * Flow:
 * 1. this.animateSunrise() after imgs are laoded
 * 2. this.revealScene() when lotties are ready (= sun is up)
 * 3. this.animateParalax() for an eternity
 *
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
  lottiePlaying: string[];

  constructor(appId: string, config: Config, onReady?: () => void) {
    super(appId, config);
    this.paralaxDestination = { x: 0, y: 0 };
    this.paralaxPosition = { x: 0, y: 0 };
    this.isSunUp = false;
    this.sunPosition = 0;
    this.sunEl = null;
    this.vH = this.rootEl.clientHeight;
    this.vW = this.rootEl.clientWidth;
    this.attachListeners();
    this.lottiePlaying = [];
    this.onMouseMove();
    this.addEventListener("static_assets_loaded", () => {
      this.animateSunRise();
    });

    this.addEventListener("lottie_assets_loaded", () => {
      this.loadedSceneItems.lottie.forEach((lottie) => {
        lottie.addEventListener("lottie_playing", () => {
          this.lottiePlaying.push(lottie.dataset.name);
        });

        lottie.addEventListener("lottie_completed", () => {
          const listWithoutCurrent = this.lottiePlaying.filter(
            (l) => l !== lottie.dataset.name,
          );
          this.lottiePlaying = listWithoutCurrent;
        });
      });
    });

    this.onReady = onReady;
  }

  public onPlayback(cb: () => void) {
    this.addEventListener("lottie_playing", cb);
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
        }, i * 80);
      });
    });

    Promise.all(staggeredScene).then(() => {
      this.onReady();
      this.animateParalax();
    });
  }

  sunrise() {
    const sunTarget =
      this.loadedSceneItems.lottie.length / this.sceneItemsCount.lottie;
    const distance = sunTarget - this.sunPosition;
    const step = 0.03;
    this.sunPosition += distance * step;
    const sunEl = this.loadedSceneItems.static.find(
      (item) => item.dataset.name === "sun",
    );

    sunEl.style.transformOrigin = `50% ${0 * 60 * (1 - this.sunPosition) + 54.4}%`;
    // sunEl.classList.add("sun", "rotate");
    sunEl.style.transform = `rotate(${360 * this.sunPosition}deg) translateY(${0 * 60 * (1 - this.sunPosition)}%)`;
    this.isSunUp = this.sunPosition >= 0.999;

    if (this.isSunUp) {
      // sunEl.classList.remove("rotate");
      // sunEl.classList.add("animation-paused");
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
        1 - pathCenterXNorm * this.paralaxPosition.x * 0.2 * paralaxAmount;

      item.style.transform = `
        rotateY(${this.paralaxPosition.x * 2.5}deg)
        rotateX(${-1 * this.paralaxPosition.y * 2.5}deg)
        scale(${scale})
        translate(${paralaxPositionX}px, ${paralaxPositionY}px)
      `;
    });
  }

  animateParalax() {
    function raf() {
      if (this.lottiePlaying.length === 0) {
        this.paralax();
      }
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
