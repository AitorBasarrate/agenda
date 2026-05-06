import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CalendarView } from "./../app/components/calendar-view";

const currentDate = new Date(2026, 3, 1); // April 2026

const renderCalendar = (overrides = {}) =>
  render(
    <CalendarView
      currentDate={currentDate}
      selectedDate={null}
      events={{}}
      onPrevMonth={vi.fn()}
      onNextMonth={vi.fn()}
      onDateClick={vi.fn()}
      {...overrides}
    />,
  );

describe("CalendarView Component", () => {
  it("renders the current month and year header", () => {
    renderCalendar();
    expect(screen.getByText("Abril 2026")).toBeInTheDocument();
  });

  it("renders the weekday labels", () => {
    renderCalendar();
    ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it("calls onPrevMonth and onNextMonth when navigation buttons are clicked", () => {
    const onPrevMonth = vi.fn();
    const onNextMonth = vi.fn();

    renderCalendar({ onPrevMonth, onNextMonth });

    const navButtons = screen.getAllByRole("button").slice(0, 2);
    fireEvent.click(navButtons[0]);
    fireEvent.click(navButtons[1]);

    expect(onPrevMonth).toHaveBeenCalledTimes(1);
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });

  it("calls onDateClick with the date when a day cell is clicked", () => {
    const onDateClick = vi.fn();
    renderCalendar({ onDateClick });

    // The day "15" of April 2026 should be present.
    fireEvent.click(screen.getByText("15"));

    expect(onDateClick).toHaveBeenCalledTimes(1);
    const arg = onDateClick.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Date);
    expect(arg.getDate()).toBe(15);
    expect(arg.getMonth()).toBe(3);
    expect(arg.getFullYear()).toBe(2026);
  });

  it("renders events for a given day", () => {
    const date = new Date(2026, 3, 10);
    const dateKey = date.toDateString(); 
    const events = {
      [dateKey]: [
        {
          id: 1,
          title: "Mi evento",
          description: "",
          start_time: date.toISOString(),
          end_time: date.toISOString(),
        },
      ],
    };

    renderCalendar({ events });
    expect(screen.getByText("Mi evento")).toBeInTheDocument();
  });

  it("shows a +N indicator when there are more than 2 events on a day", () => {
    // CalendarView.tsx shows slice(0, 2) and +N if length > 2
    const date = new Date(2026, 3, 12);
    const dateKey = date.toDateString();
    const make = (id) => ({
      id,
      title: `Evento ${id}`,
      description: "",
      start_time: date.toISOString(),
      end_time: date.toISOString(),
    });
    const events = {
      [dateKey]: [make(1), make(2), make(3), make(4)],
    };

    renderCalendar({ events });
    expect(screen.getByText("+2 más")).toBeInTheDocument();
  });
});
