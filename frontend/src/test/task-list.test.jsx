import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskList } from "./../app/components/task-list";

const makeTask = (overrides = {}) => ({
  id: 1,
  text: "Tarea pendiente",
  completed: false,
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

<<<<<<< Updated upstream
    expect(screen.getByText("No hay tareas aún")).toBeInTheDocument();
=======
    expect(screen.getByText("No hay tareas pendientes")).toBeInTheDocument();
>>>>>>> Stashed changes
  });

  it("renders pending and completed tasks in their sections", () => {
    render(
      <TaskList
        tasks={[
          makeTask({ id: 1, text: "Pendiente A" }),
          makeTask({ id: 2, text: "Hecha B", completed: true }),
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

    const input = screen.getByPlaceholderText("Nueva tarea...");
    fireEvent.change(input, { target: { value: "Nueva" } });
    
    // The submit button is the one with the plus icon
    const submitButton = screen.getByRole("button", { name: "" }); // Plus icon button has no text
    fireEvent.click(submitButton);
    
    expect(onAddTask).toHaveBeenCalledWith("Nueva");
  });

  it("calls onToggleTask when a task's check button is clicked", () => {
    const onToggleTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: 7, text: "Toggle me" })]}
        onAddTask={vi.fn()}
        onToggleTask={onToggleTask}
        onDeleteTask={vi.fn()}
      />,
    );

    // Toggle button is the first button in the task item
    const toggleButton = screen.getAllByRole("button")[1]; // [0] is submit, [1] is toggle, [2] is delete
    fireEvent.click(toggleButton);

    expect(onToggleTask).toHaveBeenCalledWith(7);
  });

  it("calls onDeleteTask when a task's delete button is clicked", () => {
    const onDeleteTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: 9, text: "Delete me" })]}
        onAddTask={vi.fn()}
        onToggleTask={vi.fn()}
        onDeleteTask={onDeleteTask}
      />,
    );

    const deleteButton = screen.getAllByRole("button")[2]; 
    fireEvent.click(deleteButton);

    expect(onDeleteTask).toHaveBeenCalledWith(9);
  });
<<<<<<< Updated upstream

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
=======
>>>>>>> Stashed changes
});
