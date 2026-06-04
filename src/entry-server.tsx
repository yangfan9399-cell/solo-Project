import { createHandler, StartServer } from "solid-start/entry-server";

export default createHandler(
  (event) => <StartServer event={event} />
);
