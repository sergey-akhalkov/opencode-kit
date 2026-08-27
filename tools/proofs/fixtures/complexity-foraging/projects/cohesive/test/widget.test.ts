import { describeWidget } from "../src/index.ts";

if (describeWidget("demo") !== "widget:demo") throw new Error("widget behavior changed");
