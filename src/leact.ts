class Leact {
  nextUnitOfWork: any = null;
  wipRoot: Fiber = null;
  currentRoot: Fiber = null;
  deletions: Fiber[] = null;

  constructor() {
    (window as any).requestIdleCallback(this.workLoop.bind(this));
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

    (window as any).requestIdleCallback(this.workLoop.bind(this));
  }

  private updateDom(dom: HTMLElement | Text, prevProps: {children: (LeactElement)[], [key:string] : any }, nextProps: {children: (LeactElement)[], [key:string] : any }) {
    const isEvent = (key: string) => key.startsWith('on');
    const isProperty = (key: string) =>
      key !== 'children' && !isEvent(key);
    const isNew = (prev: {[key:string]: any}, next: {[key:string]: any}) => (key: string) =>
      prev[key] !== next[key];
    const isGone = (prev: {[key:string]: any}, next: {[key:string]: any}) => (key:string) => !(key in next);

    // old event handlers - if changed remove from node
    Object.keys(prevProps)
      .filter(isEvent)
      .filter(
        key => !(key in nextProps) || isNew(prevProps, nextProps)(key)
      )
      .forEach(name => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(
          eventType,
          prevProps[name]
        );
      });

    // get rid of old properties
    Object.keys(prevProps)
      .filter(isProperty)
      .filter(isGone(prevProps, nextProps))
      .forEach(name => {
        dom[name] = '';
      });

    // set new or changed properties
    Object.keys(nextProps)
      .filter(isProperty)
      .filter(isNew(prevProps,nextProps))
      .forEach(name => {
        dom[name] = '';
      });

    // add new event handlers
    Object.keys(prevProps)
      .filter(isEvent)
      .filter(
        key => !(key in nextProps) || isNew(prevProps, nextProps)(key)
      )
      .forEach(name => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(
          eventType,
          prevProps[name]
        );
      });
  }

  private commitRoot() {
    this.deletions.forEach(this.commitWork);
    this.commitWork(this.wipRoot.child);
    this.currentRoot = this.wipRoot;
    this.wipRoot = null;
  }

  private commitWork(fiber: Fiber) {
    if(!fiber) {
      return;
    }
    const domParent = fiber.parent.dom;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'DELETION') {
      domParent.removeChild(fiber.dom);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
      this.updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }

    domParent.appendChild(fiber.dom);
    this.commitWork(fiber.child);
    this.commitWork(fiber.sibling);
  }

  private performUnitOfWork(fiber: Fiber) {
    if (!fiber.dom) {
      fiber.dom = this.createDom(fiber);
    }

    const elements = fiber.props.children;
    this.reconcileChildren(fiber, elements);

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

  private reconcileChildren(wipFiber: Fiber, elements: LeactElement[]) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling: Fiber = null;

    // TODO: non strict equals?
    while (index < elements.length || oldFiber !== null) {
      const element = elements[index];
      let newFiber: Fiber = null;

      const sameType = oldFiber && element && element.type === oldFiber.type;

      if (sameType) {
        newFiber = {
          type: oldFiber.type,
          props: element.props,
          dom: oldFiber.dom,
          parent: wipFiber,
          alternate: oldFiber,
          effectTag: 'UPDATE',
        };
      }

      if (element && !sameType) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: wipFiber,
          alternate: null,
          effectTag: 'PLACEMENT',
        }
      }

      if (oldFiber && !sameType) {
        oldFiber.effectTag = 'DELETION';
        this.deletions.push(oldFiber);
      }

      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (element) {
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
      index++;
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
    this.deletions = [];
    this.nextUnitOfWork = this.wipRoot;
  }
}


interface Fiber {
  props: {children: (LeactElement)[], [key:string] : any };
  dom: HTMLElement | Text;
  type?: string;
  // props for the traversing and rendering
  parent?: Fiber;
  sibling?: Fiber;
  child?: Fiber;
  // previous version of fiber that we sent off to dom
  alternate?: Fiber;
  effectTag?: 'UPDATE' | 'PLACEMENT' | 'DELETION';
}

export interface LeactElement {
  type: string;
  props: {children: (LeactElement)[], [key:string] : any };
}

export default new Leact() as Leact;
