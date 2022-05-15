// const element = {
//   type: "h1",
//   props: {
//     title: "foo",
//     children: "Hello",
//   },
// };
const Didact = {
  createElement,
  render,
};
// const element = Didact.createElement(
//   "div",
//   { id: "foo" },
//   Didact.createElement("a", null, "bar"),
//   Didact.createElement("b")
// );

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
const container = document.getElementById("root");
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

function commitRoot() {
  // TODO add nodes to dom
  commitWork(wipRoot.child);
  // 目前渲染的虚拟树
  currentRoot = wipRoot;
  // 工作树清空
  wipRoot = null;
}
// 递归提交任务
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
//
let nextUnitOfWork = null;
// 工作树
let wipRoot = null;
// 虚拟树
let currentRoot = null;
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  // 如果没有下个单元任务和工作树存在
  if (!nextUnitOfWork && wipRoot) {
    // 提交root任务
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
  // TODO add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 把当前dom节点加到parent中
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  // TODO create new fibers
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;
  // 子节点遍历到底部
  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
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
  // TODO return next unit of work
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  // 向上寻找兄弟姐妹节点
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

Didact.render(element, container);

// const text = document.createTextNode("");
// text["nodeValue"] = element.props.children;

// container.appendChild(node);
