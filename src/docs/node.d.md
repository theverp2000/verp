Object {
  constructor()
  hasOwnerProperty()
  isPrototypeOf()
  propertyIsEnumerable()
  toLocalString()
  toString()
  valueOf()
}

Node extends Object {
  appendChild(newChild)

  ATTRIBUTE_NODE: 2
  attributes:
  CDATA_SECTION_NODE: 4
  COMMENT_NODE: 8
  DOCUMENT_FRAGMENT_NODE: 11
  DOCUMENT_NODE: 9
  DOCUMENT_TYPE_NODE: 10
  ELEMENT_NODE: 9
  ENTITY_NODE: 1
  ENTITY_REFERENCE_NODE: 5
  firstChild:
  hasAttributes()
  hasChildren()
  insertBefore(..)
  isDefaultNamespace(namespaceURI)
  isSupported(feature,version)
  lastChild
  localName
  lookupNamespaceURI(prefix)
  lookupPrefix(namespaceURI)
  namespaceURI
  nextSibling
  nodeValue
  normalize()
  NOTATION_NODE: 12
  ownerDocument
  parentNode
  prefix
  previousSibling
  PROCESSING_INSTRUCTION_NODE: 7
  removeChild(oldChild)
  replaceChild(newChild,oldChild)
  TEXT_NODE: 3
  textContent
  toString
}

_Document {
  docType: string;
  documentElement:
  nodeName: string
  nodeType: number
  textContent

  constructor()
  createAttribute(name): Attr
  createAttributeNS(namespaceURI, qualifiedName): Attr
  createCDATASection(data): CDATASection
  createComment(data): Comment;
  createDocumentFragment(): DocumentFragment
  createElement(tagName): Element;
  createElementNS(namespaceURI, qualifiedName):  Element
  createEntityReference(name): EntityReference
  createProcesingInstruction(target,data): ProcesingInstruction
  createTextNode(data): Text
  getElementById(id)
  getElementByClassName(className)
  getElementByTagName(tagName)
  getElementByTagNameNS(namespaceURI,localName)
  importNode(importedNode,deep)
  insertBefore(newChild, refChild)
  removeChild(oldChild)
}

Document extends _Document {
  _inc: number
  childrenNodes: NodeList = {};
  docType: string;
  documentElement: Element = {};
  documentURI: string;
  firstChild: ProcessingInstruction = {};
  implementation: DOMImplementation = {};
  lastChild: Element = {};
  textContent: string
}


Element extends Node {
  _nsMap = {};
  attributes: NamedNodeMap = {};
  childrenNodes: NodeList = {};
  columnNumber: number;
  firstChild: Object = {};
  lastChild: Object = {};
  lineNumber: number;
  localName: string;
  namespaceURI: string;
  nextSibling: Object;
  nodeName: string;
  ownerDocument: Document = {};
  parentNode: Element;
  previousSibling: Object;
  tagName: string;
  textContent: string; 
}

NamedNodeMap {
  getNamedItem(key): Attr;
  getNamedItemNS(namespaceURI, localName): Attr;
  item(index): Attr;
  length: number;
  removeNamedItem(key): Attr;
  removeNamedItemNS(namespaceURI, localName): Attr;
  setNamedItem(attr): Attr;
}

NodeList {
  [index: number]: Element;
  length: number;
}

Text {
  columnNumber: number;
  data: string;
  length: number;
  lineNumber: number;
  nextSibling: Element;
  nodeValue: string;
  ownerDocument: Document;
  parentNode: Element;
  previousSibling: Element;
  textContent: string
}

npm install --global windows-build-tools
pip install setuptools