import { component$, type JSXNode, Slot } from '@builder.io/qwik';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: JSXNode;
}

export const PageHeader = component$<PageHeaderProps>(({ title, subtitle, actions }) => {
  return (
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
});
