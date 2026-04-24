import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskModal } from "./../app/components/task-modal";

const selectedDate = new Date(2026, 3, 24);

describe("TaskModal Component", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <TaskModal
        isOpen={false}
        selectedDate={selectedDate}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when selectedDate is null", () => {
    const { container } = render(
      <TaskModal
        isOpen={true}
        selectedDate={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders form fields when open", () => {
    render(
      <TaskModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Agregar Tarea")).toBeInTheDocument();
    expect(screen.getByLabelText("Título de la tarea")).toBeInTheDocument();
    expect(screen.getByLabelText("Hora")).toBeInTheDocument();
    expect(screen.getByLabelText("Descripción (opcional)")).toBeInTheDocument();
  });

  it("calls onSave with combined date+time and closes when submitted", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <TaskModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Título de la tarea"), {
      target: { value: "Comprar pan" },
    });
    fireEvent.change(screen.getByLabelText("Hora"), {
      target: { value: "08:30" },
    });
    fireEvent.change(screen.getByLabelText("Descripción (opcional)"), {
      target: { value: "Panadería" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar Tarea" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const arg = onSave.mock.calls[0][0];
    expect(arg.title).toBe("Comprar pan");
    expect(arg.description).toBe("Panadería");
    const dueDate = new Date(arg.due_date);
    expect(dueDate.getHours()).toBe(8);
    expect(dueDate.getMinutes()).toBe(30);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onSave when title or hour is missing", () => {
    const onSave = vi.fn();
    render(
      <TaskModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    fireEvent.submit(
      screen.getByRole("button", { name: "Guardar Tarea" }).closest("form"),
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onClose when the close (X) button is clicked", () => {
    const onClose = vi.fn();
    render(
      <TaskModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={onClose}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
