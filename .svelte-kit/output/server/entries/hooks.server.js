import { i as initializeSeedData } from "../chunks/seed.js";
initializeSeedData();
async function handle({ event, resolve }) {
  const response = await resolve(event);
  return response;
}
export {
  handle
};
