class Leact {
  nextUnitOfWork: any = null;
  wipRoot: Fiber = null;
  currentRoot: Fiber = null;

  constructor() {
    (window as any).requestIdleCallback(this.workLoop);
  }


  private workLoop(deadline: any) {
    let shouldYield = false;
    while (this.nextUnitOfWork && !shouldYield) {
      this.nextUnitOfWork = this.performUnitOfWork(
        this.nextUnitOfWork
      );
      shouldYield = deadline.timeRemaining() < 1;
    }

    if (!this.nextUnitOfWork && this.wipRoot) {
      this.commitRoot();
    }

    (window as any).requestIdleCallback(this.workLoop);
  }

  private commitRoot() {
    this.commitWork(this.wipRoot.child);
    this.currentRoot = this.wipRoot;
    this.wipRoot = null;
  }

  private commitWork(fiber: Fiber) {
    if(!fiber) {
      return;
    }
    const domParent = fiber.parent.dom;
    domParent.appendChild(fiber.dom);
    this.commitWork(fiber.child);
    this.commitWork(fiber.sibling);
  }

  private performUnitOfWork(fiber: Fiber) {
    if (!fiber.dom) {
      fiber.dom = this.createDom(fiber);
    }

    const elements = fiber.props.children;
    let index = 0;
    let prevSibling: Fiber = null;

    while (index < elements.length) {
      const element = elements[index];

      const newFiber: Fiber = {
        type: element.type,
        props: element.props,
        parent: fiber,
        dom: null,
      };

      if (index === 0) {
        fiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
      index++;
    }

    if (fiber.child) {
      return fiber.child;
    }

    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent;
    }
  }

  public createElement(type: string, props: { [key: string] : any }, ...children:(string | LeactElement)[]): LeactElement {
    return {
      type,
      props: {
        ...props,
        // it's a string ? create text elem, otherwise just keep the child
        children: children.map(child => typeof child === 'string' ? this.createTextElement(child) : child),
      }
    }
  }

  public createTextElement(text: string): LeactElement {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        // later in rendering, when dom is a textnode, this prop name will ensure that text gets nodeValue
        nodeValue: text,
        children: [],
      }
    }
  }

  private createDom(fiber: Fiber) {
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);

    Object.keys(fiber.props)
      .filter(key => key !== 'children')
      .forEach(name => {
        dom[name] = fiber.props[name];
      });

    return dom;
  }

  public render(element: LeactElement , container: HTMLElement) {
    this.wipRoot = {
      dom: container,
      props: {
        children: [element],
      },
      alternate: this.currentRoot
    };
    this.nextUnitOfWork = this.wipRoot;
  }
}


interface Fiber {
  props: {children: (LeactElement)[], [key:string] : any };
  dom: HTMLElement | Text;
  type?: string;
  parent?: Fiber;
  sibling?: Fiber;
  child?: Fiber;
  alternate?: Fiber;
}

export interface LeactElement {
  type: string;
  props: {children: (LeactElement)[], [key:string] : any };
}

export default new Leact() as Leact;
