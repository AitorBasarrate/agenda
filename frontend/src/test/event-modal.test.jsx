import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EventModal } from "./../app/components/event-modal";

const selectedDate = new Date(2026, 3, 24);

describe("EventModal Component", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <EventModal
        isOpen={false}
        selectedDate={selectedDate}
        onClose={vi.fn()}
        onSave={vi.fn()}
        isDark={false}
        isMobile={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when selectedDate is null", () => {
    const { container } = render(
      <EventModal
        isOpen={true}
        selectedDate={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
        isDark={false}
        isMobile={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the form when open with a selected date", () => {
    render(
      <EventModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={vi.fn()}
        onSave={vi.fn()}
        isDark={false}
        isMobile={false}
      />,
    );

    expect(screen.getByText("Nuevo Evento")).toBeInTheDocument();
    expect(screen.getByText("Título *")).toBeInTheDocument();
    expect(screen.getByText("Hora Inicio")).toBeInTheDocument();
    expect(screen.getByText("Hora Final")).toBeInTheDocument();
  });

  it("calls onSave with form data and resets when submitted with a title", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <EventModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={onClose}
        onSave={onSave}
        isDark={false}
        isMobile={false}
      />,
    );

    const titleInput = screen.getByPlaceholderText("Ej: Reunión de equipo");
    fireEvent.change(titleInput, { target: { value: "Reunión" } });

    const timeInputs = container.querySelectorAll('input[type="time"]');
    fireEvent.change(timeInputs[0], { target: { value: "09:00" } });
    fireEvent.change(timeInputs[1], { target: { value: "10:00" } });

    const descInput = screen.getByPlaceholderText("Agrega detalles sobre el evento...");
    fireEvent.change(descInput, { target: { value: "Sync semanal" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSave).toHaveBeenCalledWith({
      title: "Reunión",
      startTime: "09:00",
      endTime: "10:00",
      description: "Sync semanal",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onSave when title is empty", () => {
    const onSave = vi.fn();
    render(
      <EventModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={vi.fn()}
        onSave={onSave}
        isDark={false}
        isMobile={false}
      />,
    );

    // The Guardar button is disabled when title is empty, click it anyway
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(
      <EventModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={onClose}
        onSave={vi.fn()}
        isDark={false}
        isMobile={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
