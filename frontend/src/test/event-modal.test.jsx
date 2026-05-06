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
      />,
    );

<<<<<<< Updated upstream
    expect(screen.getByText("Agregar Evento")).toBeInTheDocument();
    expect(screen.getByLabelText("Título del evento")).toBeInTheDocument();
    expect(screen.getByLabelText("Hora Inicio")).toBeInTheDocument();
    expect(screen.getByLabelText("Hora Final")).toBeInTheDocument();
=======
    expect(screen.getByText("Nuevo Evento")).toBeInTheDocument();
    expect(screen.getByText("Título *")).toBeInTheDocument();
    expect(screen.getByText("Hora")).toBeInTheDocument();
>>>>>>> Stashed changes
  });

  it("calls onSave with form data and resets when submitted with a title", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <EventModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    const titleInput = screen.getByLabelText("Título del evento");
    fireEvent.change(titleInput, { target: { value: "Reunión" } });
    fireEvent.change(screen.getByLabelText("Hora Inicio"), {
      target: { value: "09:00" },
    });
    fireEvent.change(screen.getByLabelText("Hora Final"), {
      target: { value: "10:00" },
    });
    fireEvent.change(screen.getByLabelText("Descripción (opcional)"), {
      target: { value: "Sync semanal" },
    });

<<<<<<< Updated upstream
    fireEvent.click(screen.getByRole("button", { name: "Guardar Evento" }));
=======
    const timeInput = screen.getByLabelText("Hora");
    fireEvent.change(timeInput, { target: { value: "09:00" } });

    const descInput = screen.getByPlaceholderText("Agrega detalles sobre el evento...");
    fireEvent.change(descInput, { target: { value: "Sync semanal" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
>>>>>>> Stashed changes

    expect(onSave).toHaveBeenCalledWith({
      title: "Reunión",
      time: "09:00",
      description: "Sync semanal",
      color: "bg-[#80BF41]",
      date: "2026-4-24",
    });
  });

  it("does not call onSave when title is empty", () => {
    const onSave = vi.fn();
    render(
      <EventModal
        isOpen={true}
        selectedDate={selectedDate}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

<<<<<<< Updated upstream
    // Submit the form directly to bypass HTML5 'required' validation in jsdom.
    const form = screen
      .getByRole("button", { name: "Guardar Evento" })
      .closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form);
=======
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
>>>>>>> Stashed changes
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
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
