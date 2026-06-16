import { component$ } from "@builder.io/qwik";

interface Props {
  title: string;
}

export const RouterHead = component$<Props>(({ title }) => {
  return (
    <>
      <title>{title || "管风琴音栓记忆游戏"}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="通过记忆管风琴音栓组合来训练耳朵和记忆力" />
    </>
  );
});
