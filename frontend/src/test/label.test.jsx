import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Label } from "./../app/components/ui/label";

describe("Label Component", () => {
  it("renders the label with correct text", () => {
    render(<Label>Username</Label>);
    const label = screen.getByText("Username");
    expect(label).toBeInTheDocument();
    // Radix Label renders a <label> element
    expect(label.tagName).toBe("LABEL");
  });

  it("applies the default styling classes", () => {
    render(<Label>Username</Label>);
    const label = screen.getByText("Username");
    
    // Checking for some of the core classes defined in the component
    expect(label).toHaveClass("text-sm");
    expect(label).toHaveClass("font-medium");
    expect(label).toHaveClass("leading-none");
  });

  it("applies custom className when provided", () => {
    render(<Label className="text-red-500">Username</Label>);
    const label = screen.getByText("Username");
    
    expect(label).toHaveClass("text-red-500");
    // Should still have default classes
    expect(label).toHaveClass("text-sm");
  });

  it("passes standard label attributes like htmlFor", () => {
    render(<Label htmlFor="input-id">Username</Label>);
    const label = screen.getByText("Username");
    
    expect(label).toHaveAttribute("for", "input-id");
  });

  it("has the data-slot attribute", () => {
    render(<Label>Username</Label>);
    const label = screen.getByText("Username");
    
    expect(label).toHaveAttribute("data-slot", "label");
  });
});
