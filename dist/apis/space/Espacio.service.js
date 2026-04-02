import Espacio from "./Espacio.model.js";
import Event from "../event/event.model.js";
const toMin = (h) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
};
const hayTraslapeH = (h1i, h1f, h2i, h2f) => toMin(h1i) < toMin(h2f) && toMin(h1f) > toMin(h2i);
export const findAllEspacios = async () => {
    return Espacio.find().populate("destino", "nombre posicion");
};
export const findEspaciosSugeridos = async (fechaStr, horaInicio, horaFin, cupos, destinoId) => {
    if (!fechaStr || !horaInicio || !horaFin || !cupos) {
        throw new Error("Faltan parámetros requeridos para sugerencias de espacios.");
    }
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) {
        throw new Error("Fecha inválida para sugerencias de espacios.");
    }
    fecha.setUTCHours(0, 0, 0, 0);
    const fechaSiguiente = new Date(fecha);
    fechaSiguiente.setUTCDate(fechaSiguiente.getUTCDate() + 1);
    // Rango de cupos: espacios con la misma cantidad o más cupos que el evento
    const cuposMin = cupos;
    const query = {
        cupos: { $gte: cuposMin },
        ocupado: false
    };
    if (destinoId)
        query.destino = destinoId;
    const espacios = await Espacio.find(query)
        .populate("destino", "nombre posicion");
    const eventos = await Event.find({
        activo: true,
        fecha: { $gte: fecha, $lt: fechaSiguiente }
    }).populate("espacio");
    const espaciosDisponibles = espacios.filter(espacio => {
        return !eventos.some(ev => {
            if (!ev.espacio)
                return false;
            const espacioEvId = ev.espacio?._id?.toString() || ev.espacio.toString();
            if (espacioEvId !== espacio._id.toString())
                return false;
            return hayTraslapeH(horaInicio, horaFin, ev.horaInicio, ev.horaFin);
        });
    });
    // Ordenar por conveniencia: espacios con cupos más cercanos al requerido primero
    espaciosDisponibles.sort((a, b) => Math.abs(a.cupos - cupos) - Math.abs(b.cupos - cupos));
    // Retornar al menos 5 sugerencias, o todos si hay menos de 5
    return espaciosDisponibles.slice(0, Math.max(5, espaciosDisponibles.length));
};
export const findEspacioById = async (id) => {
    return Espacio.findById(id).populate("destino", "nombre posicion");
};
export const findEspaciosByDestino = async (destinoId) => {
    return Espacio.find({ destino: destinoId }).populate("destino", "nombre posicion");
};
export const findEspaciosDisponiblesByDestino = async (destinoId) => {
    return Espacio.find({ destino: destinoId, ocupado: false }).populate("destino", "nombre posicion");
};
export const createEspacio = async (data) => {
    const espacio = new Espacio(data);
    return espacio.save();
};
export const updateEspacio = async (id, data) => {
    return Espacio.findByIdAndUpdate(id, data, { returnDocument: "after", new: true });
};
export const deleteEspacio = async (id) => {
    return Espacio.findByIdAndDelete(id);
};
export const setOcupado = async (id, ocupado) => {
    return Espacio.findByIdAndUpdate(id, { ocupado }, { returnDocument: "after", new: true });
};
