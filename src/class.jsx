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
function App(props) {
  return <h1 onClick={() => console.log("1111")}>Hi {props.name}</h1>;
}

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
  // 提交时
  deletions.forEach(commitWork);
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
  //   the fiber from a function component doesn’t have a DOM node
  //   and the children come from running the function
  //   instead of getting them directly from the props
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  // 放置
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  }
  // 更新
  else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  // 删除
  else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
// 判断事件
const isEvent = (key) => key.startsWith("on");
// 判断属性
const isProperty = (key) => key !== "children" && !isEvent(key);
// 判断新节点
const isNew = (prev, next) => (key) => prev[key] !== next[key];
// 判断键是否存在
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // TODO
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}
// 下个单元任务
let nextUnitOfWork = null;
// 工作树
let wipRoot = null;
// 虚拟树
let currentRoot = null;
// 需要删除的节点
let deletions = null;

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {
  // console.log("workLoop");
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  // 如果没有下个单元任务和工作树存在
  if (!nextUnitOfWork && wipRoot) {
    // 提交root任务
    // console.log("commitRoot");
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);
function performUnitOfWork(fiber) {
  // TODO add dom node
  //   判断是否为函数
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  // TODO create new fibers
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

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

// 更新函数
function updateFunctionComponent(fiber) {
  // TODO
  //   here the fiber.type is the App function
  //   and when we run it, it returns the h1 element.
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}
// 更新class
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

// 协调子节点
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  // 工作树的子节点
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  // 子节点遍历到底部
  while (index < elements.length || oldFiber != null) {
    // 获取子元素
    const element = elements[index];
    let newFiber = null;
    // 判断类型是否相同
    const sameType = oldFiber && element && element.type == oldFiber.type;
    // 相同类型
    if (sameType) {
      // TODO update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    // 子元素存在但类型不同
    if (element && !sameType) {
      // TODO add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    // 子元素不存在但工作树有节点
    if (oldFiber && !sameType) {
      // TODO delete the oldFiber's node
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }
    // 如果是第一个，就设置为根节点
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}
const container = document.getElementById("root");
Didact.render(element, container);

// const text = document.createTextNode("");
// text["nodeValue"] = element.props.children;

// container.appendChild(node);
