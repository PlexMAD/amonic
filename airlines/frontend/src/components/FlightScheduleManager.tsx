import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Airport {
  id: number;
  name: string;
  iata_code: string;
}

interface Aircraft {
  id: number;
  name: string;
  make_model: string;
  total_seats: number;
  economy_seats: number;
  business_seats: number;
}

interface Flight {
  id: number;
  date: string;
  time: string;
  from_airport: Airport;
  to_airport: Airport;
  flight_number: string;
  aircraft: Aircraft;
  economy_price: number;
  business_price: number;
  first_class_price: number;
  confirmed: boolean;
  aircraft_id?: number; 
}

const FlightScheduleManagement: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [originalFlights, setOriginalFlights] = useState<Flight[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [filters, setFilters] = useState({
    departureAirport: '',
    arrivalAirport: '',
    date: '',
    flightNumber: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    fetchFlights();
    fetchAirports();
    fetchAircrafts();
  }, []);

  const fetchFlights = async () => {
    const accessToken = localStorage.getItem('access_token');
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/schedules/', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setFlights(response.data);
      setOriginalFlights(response.data);
    } catch (error) {
      console.error("Error fetching flight schedules", error);
    }
  };

  const fetchAirports = async () => {
    const accessToken = localStorage.getItem('access_token');
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/airports/', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAirports(response.data);
    } catch (error) {
      console.error("Error fetching airports", error);
    }
  };

  const fetchAircrafts = async () => {
    const accessToken = localStorage.getItem('access_token');
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/aircrafts/', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAircrafts(response.data);
    } catch (error) {
      console.error("Error fetching aircrafts", error);
    }
  };

  const applyFilters = () => {
    const filteredFlights = originalFlights.filter((flight) => {
      const matchesDeparture = filters.departureAirport === '' || flight.from_airport.id === parseInt(filters.departureAirport);
      const matchesArrival = filters.arrivalAirport === '' || flight.to_airport.id === parseInt(filters.arrivalAirport);
      const matchesDate = filters.date === '' || flight.date === filters.date;
      const matchesFlightNumber = filters.flightNumber === '' || flight.flight_number.includes(filters.flightNumber);

      return matchesDeparture && matchesArrival && matchesDate && matchesFlightNumber;
    });

    if (sortBy === 'date') {
      filteredFlights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === 'price') {
      filteredFlights.sort((a, b) => a.economy_price - b.economy_price);
    } else if (sortBy === 'status') {
      filteredFlights.sort((a, b) => Number(b.confirmed) - Number(a.confirmed));
    }

    setFlights(filteredFlights);
  };

  const cancelFlight = async (flightId: number) => {
    const accessToken = localStorage.getItem('access_token');
    try {
      await axios.patch(`http://127.0.0.1:8000/api/update_schedule/${flightId}/`, { confirmed: false }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setFlights((prevFlights) =>
        prevFlights.map((flight) =>
          flight.id === flightId ? { ...flight, confirmed: false } : flight
        )
      );
      setOriginalFlights((prevFlights) =>
        prevFlights.map((flight) =>
          flight.id === flightId ? { ...flight, confirmed: false } : flight
        )
      );
    } catch (error) {
      console.error("Error cancelling flight", error);
    }
  };

  const reactivateFlight = async (flightId: number) => {
    const accessToken = localStorage.getItem('access_token');
    try {
      await axios.patch(`http://127.0.0.1:8000/api/update_schedule/${flightId}/`, { confirmed: true }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setFlights((prevFlights) =>
        prevFlights.map((flight) =>
          flight.id === flightId ? { ...flight, confirmed: true } : flight
        )
      );
      setOriginalFlights((prevFlights) =>
        prevFlights.map((flight) =>
          flight.id === flightId ? { ...flight, confirmed: true } : flight
        )
      );
    } catch (error) {
      console.error("Error reactivating flight", error);
    }
  };

  const handleEditFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFlight(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (selectedFlight) {
      setSelectedFlight({ ...selectedFlight, [name]: value });
    }
  };

  const handleSave = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (selectedFlight) {
      try {
        await axios.patch(`http://127.0.0.1:8000/api/update_schedule/${selectedFlight.id}/`, selectedFlight, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        fetchFlights();
        handleCloseModal();
      } catch (error) {
        console.error("Error updating flight", error);
      }
    }
  };

  return (
    <div className="flight-schedule-management">
      <div className="flight-schedule-management__filters">
        <select
          className="flight-schedule-management__select"
          value={filters.departureAirport}
          onChange={(e) => setFilters({ ...filters, departureAirport: e.target.value })}
        >
          <option value="">Выберите аэропорт отправления</option>
          {airports.map((airport) => (
            <option key={airport.id} value={airport.id}>
              {airport.name}
            </option>
          ))}
        </select>

        <select
          className="flight-schedule-management__select"
          value={filters.arrivalAirport}
          onChange={(e) => setFilters({ ...filters, arrivalAirport: e.target.value })}
        >
          <option value="">Выберите аэропорт назначения</option>
          {airports.map((airport) => (
            <option key={airport.id} value={airport.id}>
              {airport.name}
            </option>
          ))}
        </select>

        <input
          className="flight-schedule-management__input"
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
        <input
          className="flight-schedule-management__input"
          type="text"
          placeholder="Номер рейса"
          value={filters.flightNumber}
          onChange={(e) => setFilters({ ...filters, flightNumber: e.target.value })}
        />
        <select className="flight-schedule-management__select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'status')}>
          <option value="date">Сортировать по дате</option>
          <option value="price">Сортировать по цене</option>
          <option value="status">Сортировать по статусу</option>
        </select>
        <button className="flight-schedule-management__button" onClick={applyFilters}>Применить фильтры</button>
      </div>

      <table className="flight-schedule-management__table">
        <thead>
          <tr className="flight-schedule-management__table-header">
            <th>Дата</th>
            <th>Время</th>
            <th>Откуда</th>
            <th>Куда</th>
            <th>Номер рейса</th>
            <th>Самолет</th>
            <th>Цена (эконом)</th>
            <th>Цена (бизнес)</th>
            <th>Цена (первый класс)</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {flights.map((flight) => (
            <tr key={flight.id} className={`flight-schedule-management__table-row ${!flight.confirmed ? 'flight-schedule-management__table-row--cancelled' : ''}`}>
              <td>{flight.date}</td>
              <td>{flight.time}</td>
              <td>{flight.from_airport.name}</td>
              <td>{flight.to_airport.name}</td>
              <td>{flight.flight_number}</td>
              <td>{flight.aircraft.name}</td>
              <td>{flight.economy_price}</td>
              <td>{flight.business_price}</td>
              <td>{flight.first_class_price}</td>
              <td>{flight.confirmed ? 'Подтверждено' : 'Отменено'}</td>
              <td>
                <button className="flight-schedule-management__button" onClick={() => handleEditFlight(flight)}>Редактировать</button>
                {flight.confirmed ? (
                  <button className="flight-schedule-management__button" onClick={() => cancelFlight(flight.id)}>Отменить</button>
                ) : (
                  <button className="flight-schedule-management__button" onClick={() => reactivateFlight(flight.id)}>Реактивировать</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && selectedFlight && (
        <div className="flight-schedule-management__modal">
          <h2 className="flight-schedule-management__modal-title">Редактировать рейс</h2>
          <input
            className="flight-schedule-management__modal-input"
            type="date"
            name="date"
            value={selectedFlight.date}
            onChange={handleInputChange}
          />
          <input
            className="flight-schedule-management__modal-input"
            type="time"
            name="time"
            value={selectedFlight.time}
            onChange={handleInputChange}
          />
          <label className="flight-schedule-management__modal-label">Цена (эконом):</label>
          <input
            className="flight-schedule-management__modal-input"
            type="number"
            name="economy_price"
            value={selectedFlight.economy_price}
            onChange={handleInputChange}
          />
          <button className="flight-schedule-management__modal-button" onClick={handleSave}>Сохранить</button>
          <button className="flight-schedule-management__modal-button" onClick={handleCloseModal}>Закрыть</button>
        </div>
      )}
    </div>
  );
};

export default FlightScheduleManagement;