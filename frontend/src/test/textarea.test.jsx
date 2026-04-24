import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Textarea } from "./../app/components/ui/textarea";

describe("Textarea Component", () => {
  it("renders a textarea element", () => {
    render(<Textarea placeholder="Notes" />);
    const textarea = screen.getByPlaceholderText("Notes");
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("has the data-slot attribute", () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute("data-slot", "textarea");
  });

  it("applies custom className while keeping defaults", () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveClass("custom-class");
    expect(textarea).toHaveClass("min-h-16");
  });

  it("calls onChange when the value changes", () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} data-testid="textarea" />);

    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "hello" },
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Textarea disabled data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toBeDisabled();
  });

  it("forwards the rows attribute", () => {
    render(<Textarea rows={5} data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute("rows", "5");
  });
});
