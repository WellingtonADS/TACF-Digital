import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useResponsive } from "./useResponsive";

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("useResponsive", () => {
  let originalWidth: number;

  beforeEach(() => {
    originalWidth = window.innerWidth;
  });

  afterEach(() => {
    setWidth(originalWidth);
  });

  it("classifica como mobile quando width < 768", () => {
    setWidth(375);
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("classifica como tablet quando width >= 768 e < 1024", () => {
    setWidth(900);
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("classifica como desktop quando width >= 1024", () => {
    setWidth(1280);
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it("reage a eventos de resize", async () => {
    setWidth(1280);
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isDesktop).toBe(true);

    await act(async () => {
      setWidth(600);
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it("largura exata de 768 é tablet (não mobile)", () => {
    setWidth(768);
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it("largura exata de 1024 é desktop (não tablet)", () => {
    setWidth(1024);
    const { result } = renderHook(() => useResponsive());
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
  });
});
