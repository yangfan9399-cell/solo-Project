import type { ParentComponent } from "solid-js";
import "./routes/index.css";

const App: ParentComponent = (props) => {
  return <div class="app-container">{props.children}</div>;
};

export default App;
