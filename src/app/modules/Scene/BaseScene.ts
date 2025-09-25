import {
  Config,
  ConfigItem,
  LottieLayer,
  StaticLayer,
} from "../../../consts/config";
import createElementFromString from "../../../utils/createElementFromString";
import LottiePlayer from "../Lottie/Lottie";
const resizeLottie = new CustomEvent("resize_lottie");

class BaseScene extends EventTarget {
  rootEl: HTMLElement;
  loadedSceneItems: {
    static: HTMLElement[];
    lottie: HTMLElement[];
    items: HTMLElement[];
  };
  sceneItemsCount: { static: number; lottie: number; total: number };
  loadedAssets: number;
  config: Config;

  constructor(rootId: string, config: Config) {
    super();
    const container = document.getElementById(rootId)!;
    const viewportEl = document.createElement("div");
    viewportEl.classList.add("viewport");
    container.appendChild(viewportEl);
    this.rootEl = viewportEl;
    this.config = config;
    this.loadedSceneItems = { static: [], lottie: [], items: [] };
    const staticItemsCount = this.config.data.filter(
      (i) => i.__typename === "STATIC",
    ).length;
    const totalItemsCount = this.config.data.length;
    this.sceneItemsCount = {
      static: staticItemsCount,
      lottie: totalItemsCount - staticItemsCount,
      total: totalItemsCount,
    };
    this.createLayers();
  }

  onStaticAssetsLoaded() {
    const event = new Event("static_assets_loaded");
    this.dispatchEvent(event);
  }

  onLottieAssetsLoaded() {
    const event = new Event("lottie_assets_loaded");
    this.dispatchEvent(event);
  }

  registerLoadedAsset(item: HTMLElement, config: ConfigItem) {
    const type = config.__typename === "LOTTIE" ? "lottie" : "static";
    this.loadedSceneItems[type].push(item);
    this.loadedSceneItems["items"].push(item);

    if (
      type === "static" &&
      this.loadedSceneItems.static.length === this.sceneItemsCount.static
    ) {
      this.loadedSceneItems.static.forEach((el) => this.rootEl.appendChild(el));
      this.onStaticAssetsLoaded();
    }

    if (
      type === "lottie" &&
      this.loadedSceneItems.lottie.length === this.sceneItemsCount.lottie
    ) {
      this.loadedSceneItems.lottie.forEach((el) => {
        this.rootEl.appendChild(el);
        el.dispatchEvent(resizeLottie);
      });
      this.onLottieAssetsLoaded();
    }
  }

  async createContainer(layer: ConfigItem) {
    const type = layer.__typename === "LOTTIE" ? "lottie" : "static";
    const container = document.createElement("div");
    container.classList.add("layer", type);
    container.setAttribute("data-name", layer.name);
    container.setAttribute("data-paralax-amount", String(layer.paralaxAmount));
    container.style.zIndex = String(layer.zIndex);

    const eventMapSrc = [
      process.env.BASE_PATH,
      "assets",
      layer.folder,
      "object.svg",
    ].join("/");
    const eventMap = await createElementFromString(eventMapSrc);
    container.appendChild(eventMap);

    return container;
  }

  async createLayers() {
    for (const layer of this.config.data) {
      if (layer.__typename === "STATIC") await this.createStaticLayer(layer);
      if (layer.__typename === "LOTTIE") await this.createLottieLayer(layer);
    }
  }

  async createStaticLayer(layer: StaticLayer) {
    const container = await this.createContainer(layer);
    const image = new Image();
    // prettier-ignore
    image.src = [process.env.BASE_PATH, "assets", layer.folder, layer.asset.src].join("/");
    container.appendChild(image);
    image.onload = () => this.registerLoadedAsset(container, layer);
  }

  async createLottieLayer(layer: LottieLayer) {
    const container = await this.createContainer(layer);
    const lottie = new LottiePlayer({
      ...layer,
      appContainer: this.rootEl,
      lottieContainer: container,
    });

    lottie.initLottie().then(() => {
      const path = container.querySelector("path");
      path.addEventListener("click", () => {
        const event = new Event("lottie_playing");
        this.dispatchEvent(event);
        lottie.play();
      });

      container.addEventListener("resize_lottie", () => {
        lottie.ref.resize();
      });

      this.registerLoadedAsset(container, layer);
    });
  }
}

export default BaseScene;
