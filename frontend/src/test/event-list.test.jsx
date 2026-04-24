import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EventList } from "./../app/components/event-list";

const baseEvent = {
  id: 1,
  title: "Reunión equipo",
  description: "Repaso semanal",
  start_time: "2026-04-24T10:00:00.000Z",
  end_time: "2026-04-24T11:00:00.000Z",
  created_at: "",
  updated_at: "",
};

describe("EventList Component", () => {
  it("shows the empty state when no date is selected", () => {
    render(
      <EventList
        selectedDate={null}
        events={[]}
        onDeleteEvent={vi.fn()}
        onAddEvent={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Selecciona un día del calendario"),
    ).toBeInTheDocument();
  });

  it("shows the empty state for a date with no events", () => {
    render(
      <EventList
        selectedDate={new Date(2026, 3, 24)}
        events={[]}
        onDeleteEvent={vi.fn()}
        onAddEvent={vi.fn()}
      />,
    );
    expect(screen.getByText("No hay eventos para este día")).toBeInTheDocument();
  });

  it("renders the list of events with their titles and descriptions", () => {
    render(
      <EventList
        selectedDate={new Date(2026, 3, 24)}
        events={[baseEvent]}
        onDeleteEvent={vi.fn()}
        onAddEvent={vi.fn()}
      />,
    );

    expect(screen.getByText("Reunión equipo")).toBeInTheDocument();
    expect(screen.getByText("Repaso semanal")).toBeInTheDocument();
  });

  it("calls onAddEvent when the add button is clicked", () => {
    const onAddEvent = vi.fn();
    render(
      <EventList
        selectedDate={new Date(2026, 3, 24)}
        events={[]}
        onDeleteEvent={vi.fn()}
        onAddEvent={onAddEvent}
      />,
    );

    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onAddEvent).toHaveBeenCalledTimes(1);
  });

  it("calls onDeleteEvent with the event id when delete is clicked", () => {
    const onDeleteEvent = vi.fn();
    render(
      <EventList
        selectedDate={new Date(2026, 3, 24)}
        events={[baseEvent]}
        onDeleteEvent={onDeleteEvent}
        onAddEvent={vi.fn()}
      />,
    );

    // First button is the add button, the second is the delete button.
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);

    expect(onDeleteEvent).toHaveBeenCalledWith(baseEvent.id);
  });
});
