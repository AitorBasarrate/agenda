import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./../app/components/ui/button";

describe("Button Component", () => {
  it("renders the children correctly", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click Me");
  });

  it("applies the correct variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("bg-destructive");
  });

  it("applies the correct size classes", () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("h-8");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disabled prop is passed", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
  });
});
