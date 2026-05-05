import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EventList } from "./../app/components/event-list";

const baseEvent = {
  id: "1",
  title: "Reunión equipo",
  description: "Repaso semanal",
  time: "10:00",
  color: "bg-[#80BF41]",
  date: "2026-4-24",
};

describe("EventList Component", () => {
  it("shows the empty state when no date is selected", () => {
    render(
      <EventList
        selectedDate={null}
        events={[]}
        onEventClick={vi.fn()}
        isDark={false}
        isMobile={false}
      />,
    );
    expect(
      screen.getByText("No hay eventos para este día"),
    ).toBeInTheDocument();
  });

  it("shows the empty state for a date with no events", () => {
    render(
      <EventList
        selectedDate={new Date(2026, 3, 24)}
        events={[]}
        onEventClick={vi.fn()}
        isDark={false}
        isMobile={false}
      />,
    );
    expect(screen.getByText("No hay eventos para este día")).toBeInTheDocument();
  });

  it("renders the list of events with their titles and descriptions", () => {
    render(
      <EventList
        selectedDate={new Date(2026, 3, 24)}
        events={[baseEvent]}
        onEventClick={vi.fn()}
        isDark={false}
        isMobile={false}
      />,
    );

    expect(screen.getByText("Reunión equipo")).toBeInTheDocument();
    expect(screen.getByText("Repaso semanal")).toBeInTheDocument();
  });

  it("calls onEventClick when an event is clicked", () => {
    const onEventClick = vi.fn();
    render(
      <EventList
        selectedDate={new Date(2026, 3, 24)}
        events={[baseEvent]}
        onEventClick={onEventClick}
        isDark={false}
        isMobile={false}
      />,
    );

    fireEvent.click(screen.getByText("Reunión equipo"));
    expect(onEventClick).toHaveBeenCalledWith(baseEvent);
  });

  it("displays event time", () => {
    render(
      <EventList
        selectedDate={new Date(2026, 3, 24)}
        events={[baseEvent]}
        onEventClick={vi.fn()}
        isDark={false}
        isMobile={false}
      />,
    );

    expect(screen.getByText("10:00")).toBeInTheDocument();
  });
});
