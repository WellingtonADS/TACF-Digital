import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Button from "../Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Confirmar</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Confirmar");
  });

  it("applies variant class for primary", () => {
    render(<Button variant="primary">Ok</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-primary");
  });

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border-primary");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Stop</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows loading spinner when isLoading", () => {
    render(<Button isLoading>Wait</Button>);
    const spinner = screen.getByRole("button")?.querySelector("span");
    expect(spinner).toBeTruthy();
  });
});
