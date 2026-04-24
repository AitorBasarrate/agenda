import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskList } from "./../app/components/task-list";

const makeTask = (overrides = {}) => ({
  id: 1,
  title: "Tarea pendiente",
  description: "",
  due_date: "2026-04-24T10:00:00.000Z",
  status: "pending",
  created_at: "",
  updated_at: "",
  ...overrides,
});

describe("TaskList Component", () => {
  it("shows the empty state when there are no tasks", () => {
    render(
      <TaskList
        tasks={[]}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    expect(screen.getByText("No hay tareas aún")).toBeInTheDocument();
  });

  it("renders pending and completed tasks in their sections", () => {
    render(
      <TaskList
        tasks={[
          makeTask({ id: 1, title: "Pendiente A" }),
          makeTask({ id: 2, title: "Hecha B", status: "completed" }),
        ]}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    expect(screen.getByText("Pendiente A")).toBeInTheDocument();
    expect(screen.getByText("Hecha B")).toBeInTheDocument();
    expect(screen.getByText(/Pendientes \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Completadas \(1\)/)).toBeInTheDocument();
  });

  it("calls onAddTask when the submit button is clicked", () => {
    const onAddTask = vi.fn();
    render(
      <TaskList
        tasks={[]}
        onAddTask={onAddTask}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "" }));
    expect(onAddTask).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleTask when a task's check button is clicked", () => {
    const onToggleTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: 7, title: "Toggle me" })]}
        onAddTask={vi.fn()}
        onToggleTask={onToggleTask}
        onDeleteTask={vi.fn()}
      />,
    );

    // Buttons in document: [submit, toggle, delete].
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    expect(onToggleTask).toHaveBeenCalledWith(7, true);
  });

  it("calls onDeleteTask when a task's delete button is clicked", () => {
    const onDeleteTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: 9, title: "Delete me" })]}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={onDeleteTask}
      />,
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);

    expect(onDeleteTask).toHaveBeenCalledWith(9);
  });

  it("updates the input value when the user types", () => {
    render(
      <TaskList
        tasks={[]}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText("Agregar nueva tarea...");
    fireEvent.change(input, { target: { value: "Nueva tarea" } });

    expect(input).toHaveValue("Nueva tarea");
  });
});
