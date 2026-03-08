import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import Card from "../../src/components/atomic/Card";

// small helper component to simulate dark mode
function DarkWrapper({ children }: { children: React.ReactNode }) {
  return <div className="dark">{children}</div>;
}

describe("contrast checks (dark mode)", () => {
  it("base layout has no violations", async () => {
    const { container } = render(
      <DarkWrapper>
        <div className="p-8 bg-bg-default text-text-body">
          <h1 className="text-2xl font-bold">Title</h1>
          <p className="mt-4">Some sample paragraph text.</p>
          <button className="mt-6 px-4 py-2 bg-primary text-white rounded">
            Action
          </button>
        </div>
      </DarkWrapper>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("card component by itself meets contrast guidelines", async () => {
    const { container } = render(
      <DarkWrapper>
        <Card className="max-w-sm">Example</Card>
      </DarkWrapper>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
