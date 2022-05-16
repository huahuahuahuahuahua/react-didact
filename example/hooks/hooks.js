import Didact from "../../src/hooks";
function App(props) {
  return <h1 onClick={() => console.log("1111")}>Hi {props.name}</h1>;
}
const element = <App name="foo" />;
const container = document.getElementById("root");
Didact.render(element, container);
