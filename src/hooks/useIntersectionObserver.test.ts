import { renderHook } from "@testing-library/react-hooks";
import { useIntersectionObserver } from "./useIntersectionObserver";

const originalObserver = IntersectionObserver;

let currentObserverCallback!: IntersectionObserverCallback;
let currentObserver!: IntersectionObserver;

/*
  This fails because CRA jest.config.js has `resetMocks: true`.
  To make it work, define the mock inline in each test or stub the `window.IntersectionObserver` just like below
*/

// jest
//   .spyOn(window, "IntersectionObserver")
//   .mockImplementation(function (cb, options) {
//     currentObserverCallback = cb;
//     currentObserver = new originalObserver(cb, options);
//     return currentObserver;
//   });

window.IntersectionObserver = function (
  cb: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  currentObserverCallback = cb;
  currentObserver = new originalObserver(cb, options);
  return currentObserver;
} as any;

beforeEach(jest.clearAllMocks);

test("onIntersectionFunction is kept up to date", async () => {
  const firstCallback = jest.fn();
  const secondCallback = jest.fn();

  const { rerender } = renderHook(useIntersectionObserver, {
    initialProps: firstCallback
  });

  currentObserverCallback([{ isIntersecting: true } as any], {} as any);
  expect(firstCallback).toHaveBeenCalledTimes(1);

  rerender(secondCallback);
  currentObserverCallback([{ isIntersecting: true } as any], {} as any);

  expect(firstCallback).toHaveBeenCalledTimes(1);
  expect(secondCallback).toHaveBeenCalledTimes(1);
});

test("cleanup happens when element is destroyed", async () => {
  const mockNode = document.createElement("div");
  const { result } = renderHook(() => useIntersectionObserver(() => null));

  const cleanupSpy = jest.spyOn(currentObserver, "unobserve");

  result.current(mockNode);

  result.current(null);
  expect(cleanupSpy).toHaveBeenCalledWith(mockNode);
});

test("observer is detached when component unmounts", () => {
  const { unmount } = renderHook(() => useIntersectionObserver(() => null));

  const disconnectSpy = jest.spyOn(currentObserver, "disconnect");

  unmount();

  expect(disconnectSpy).toHaveBeenCalledTimes(1);
});
