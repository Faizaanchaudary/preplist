import { useRoutes } from "react-router-dom";
import routeConfig from "./routeConfig";

export default function AppRouter() {
  return useRoutes(routeConfig);
}