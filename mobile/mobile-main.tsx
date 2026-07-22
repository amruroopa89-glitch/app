import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "../src/routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../src/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

const hashHistory = createHashHistory();

const router = createRouter({
  routeTree,
  history: hashHistory,
  context: { queryClient },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
