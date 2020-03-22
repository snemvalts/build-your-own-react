export default class Leact {

  public static createElement(type: string, props: { [key: string] : any }, ...children:(string | HTMLElement)[]): LeactElement {
    return {
      type,
      props: {
        ...props,
        children: children.map(child => typeof child === 'object' ? child : Leact.createTextElement(child)),
      }
    }
  }

  public static createTextElement(text: string): LeactElement {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        nodeValue: text,
        children: [],
      }
    }
  }

  public static render(element: LeactElement, container: HTMLElement) {

  }
}

export interface LeactElement {
  type: string;
  props: {children: (string | HTMLElement | LeactElement)[], [key:string] : any };
}

