import { createRoute, createRouteMask } from "@tanstack/react-router";
import { LayoutRoute } from "./routes/_layout";
import { IndexRoute } from "./routes/_layout/index";
import { TopicDetailRoute } from "./routes/_layout/topics/$topicId";
import { NewTopicRoute } from "./routes/_layout/topics/new";
import { ReviewRoute } from "./routes/_layout/review";

const rootRoute = LayoutRoute;

const indexRoute = IndexRoute;
const topicDetailRoute = TopicDetailRoute;
const newTopicRoute = NewTopicRoute;
const reviewRoute = ReviewRoute;

const routeTree = rootRoute.addChildren([
  indexRoute,
  topicDetailRoute,
  newTopicRoute,
  reviewRoute,
]);

export { routeTree };
