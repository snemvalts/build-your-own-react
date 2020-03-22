export default class Leact {

  public static createElement(type: string, props: { [key: string] : any }, ...children:(string | LeactElement)[]): LeactElement {
    return {
      type,
      props: {
        ...props,
        // it's a string ? create text elem, otherwise just keep the child
        children: children.map(child => typeof child === 'string' ? Leact.createTextElement(child) : child),
      }
    }
  }

  public static createTextElement(text: string): LeactElement {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        // later in rendering, when dom is a textnode, this prop name will ensure that text gets nodeValue
        nodeValue: text,
        children: [],
      }
    }
  }

  public static render(element: LeactElement, container: HTMLElement | Text) {
    const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type);

    Object.keys(element.props)
      .filter(key => key !== 'children')
      .forEach(name => {
        dom[name] = element.props[name];
      });

    element.props.children.forEach((child) => {
      Leact.render(child, dom);
    });

    container.appendChild(dom);
  }
}

export interface LeactElement {
  type: string;
  props: {children: (LeactElement)[], [key:string] : any };
}

