import { redirect } from "react-router";

export const loader = async () => {
  return redirect("/permits");
};

export default function Index() {
  return null;
}
