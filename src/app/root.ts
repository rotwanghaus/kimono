import dat = require("dat.gui");
import { config } from "../consts/config";
import ParalaxInfo from "./modules/ParalaxInfo/ParalaxInfo";
import Scene from "./modules/Scene";
import Stats from "stats.js";

// const phoneSize = 600;
// const isPhone = window.innerWidth < phoneSize;
const scene = new Scene("root", config);
const instructionEl = document.querySelector("#instruction");

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

scene.onPlayback(() => {
  instructionEl.classList.remove("show");
});

scene.onReady = () => {
  instructionEl.classList.toggle("show");

  if (process.env.NODE_ENV === "production") return;
  function fpsMeter() {
    // let prevTime = Date.now(),
    //   frames = 0;

    requestAnimationFrame(function loop() {
      stats.begin();
      stats.end();
      //   const time = Date.now();
      //   frames++;
      //   if (time > prevTime + 1000) {
      //     let fps = Math.round((frames * 1000) / (time - prevTime));
      //     prevTime = time;
      //     frames = 0;
      //
      //     console.info("FPS: ", fps);
      //   }
      //
      requestAnimationFrame(loop);
    });
  }

  fpsMeter();
  const gui = new dat.GUI({ name: "Settings" });
  // gui.close();
  const folder = gui.addFolder("paralaxAmount");
  folder.open();
  // prettier-ignore
  const layers = Array.from(document.querySelectorAll(".layer")) as HTMLElement[];
  const svgs = Array.from(document.querySelectorAll(".layer svg"));
  const paths = Array.from(document.querySelectorAll(".layer svg path"));

  let labels: ParalaxInfo[] = [];

  gui.add({ debug: false }, "debug").onChange((debug) => {
    if (debug) {
      paths.forEach((path, i) => labels.push(new ParalaxInfo(layers[i], path)));
      svgs.forEach((svg) => svg.classList.add("debug"));
      window.requestAnimationFrame(raf);
    } else {
      labels.forEach((label) => label.destroy());
      svgs.forEach((svg) => svg.classList.remove("debug"));
      labels = [];
    }

    function raf() {
      if (!debug) return;
      labels.forEach((label) => {
        const parent = label.target.closest("div");
        label.updatePosition();
        const transform = parent.style.transform;
        const scale = /scale\((\d+(.\d+)?)\)/.exec(transform);
        label.updateLabel(`scale ${scale?.[1]}`);
      });
      window.requestAnimationFrame(raf);
    }
  });

  layers.forEach((el) => {
    const name = el.dataset.name!;
    const paralaxAmount = Number(el.dataset.paralaxAmount);
    folder.add({ [name]: paralaxAmount }, name, -1, 1).onChange((val) => {
      el.setAttribute("data-paralax-amount", val);
    });
  });
};

export default Scene;
