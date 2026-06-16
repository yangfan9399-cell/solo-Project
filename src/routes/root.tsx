import { Suspense, type ParentComponent } from "solid-js";
import "./index.css";

const Root: ParentComponent = (props) => {
  return (
    <div class="app-container">
      <Suspense>{props.children}</Suspense>
    </div>
  );
};

export default Root;
