// This file should be excluded when using !src/api/tests pattern
import { routes } from "../routes";

test("routes exist", () => {
  expect(routes.home).toBe("/");
});
