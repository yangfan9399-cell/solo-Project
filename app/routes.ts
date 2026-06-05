export default [
  {
    path: "resources/workers-by-team",
    file: "routes/resources.workers-by-team.ts",
  },
  {
    path: "resources/check-area-conflict",
    file: "routes/resources.check-area-conflict.ts",
  },
  {
    path: "",
    file: "routes/_app.tsx",
    children: [
      { index: true, file: "routes/_index.tsx" },
      {
        path: "permits",
        file: "routes/permits.tsx",
        children: [
          { index: true, file: "routes/permits._index.tsx" },
          { path: "new", file: "routes/permits.new.tsx" },
          { path: ":id", file: "routes/permits.$id.tsx" },
        ],
      },
      { path: "statistics", file: "routes/statistics.tsx" },
    ],
  },
];
