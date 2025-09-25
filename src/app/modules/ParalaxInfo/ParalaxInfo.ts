import getElementCenter from "../../../utils/getElementCenter";

class ParalaxInfo {
  hasPosition: boolean;
  element: HTMLElement;
  container: HTMLElement;
  target: Element;

  constructor(container: HTMLElement, target: Element) {
    const label = document.createElement("span");
    label.classList.add("paralax-info");
    this.target = target;
    this.element = label;
    this.container = document.querySelector(".paralax-labels");
    this.hasPosition = false;
    this.container.prepend(label);
    this.onResize();
    this.updatePosition();
  }

  private onResize() {
    window.addEventListener("resize", this.updatePosition);
  }

  destroy() {
    window.removeEventListener("resize", this.updatePosition);
    this.element.remove();
  }

  updatePosition() {
    const { x, y } = getElementCenter(this.target);
    this.element.style.cssText = `
      top: ${y}px;
      left: ${x}px;
    `;
    this.hasPosition = true;
  }

  updateLabel(value: string) {
    this.element.innerText = value;
  }
}

export default ParalaxInfo;
