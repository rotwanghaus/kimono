import dat = require("dat.gui");
import { config } from "../consts/config";
import ParalaxInfo from "./modules/ParalaxInfo/ParalaxInfo";
import Scene from "./modules/Scene";
// const phoneSize = 600;
// const isPhone = window.innerWidth < phoneSize;
const scene = new Scene("root", config);

scene.onReady = () => {
  if (process.env.NODE_ENV === "production") return;
  function fpsMeter() {
    let prevTime = Date.now(),
      frames = 0;

    requestAnimationFrame(function loop() {
      const time = Date.now();
      frames++;
      if (time > prevTime + 1000) {
        let fps = Math.round((frames * 1000) / (time - prevTime));
        prevTime = time;
        frames = 0;

        console.info("FPS: ", fps);
      }

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
        label.updatePosition();
        const transform = label.container.style.transform;
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
