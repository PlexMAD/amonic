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
}

const FlightScheduleManagement: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filters, setFilters] = useState({
    departureAirport: '',
    arrivalAirport: '',
    date: '',
    flightNumber: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await axios.get('/api/schedules/');
      setFlights(response.data);
    } catch (error) {
      console.error("Error fetching flight schedules", error);
    }
  };

  const applyFilters = () => {
    const filteredFlights = flights.filter((flight) => {
      const matchesDeparture = filters.departureAirport === '' || flight.from_airport.name.toLowerCase().includes(filters.departureAirport.toLowerCase());
      const matchesArrival = filters.arrivalAirport === '' || flight.to_airport.name.toLowerCase().includes(filters.arrivalAirport.toLowerCase());
      const matchesDate = filters.date === '' || flight.date === filters.date;
      const matchesFlightNumber = filters.flightNumber === '' || flight.flight_number.includes(filters.flightNumber);

      return matchesDeparture && matchesArrival && matchesDate && matchesFlightNumber;
    });

    if (sortBy === 'date') {
      filteredFlights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      filteredFlights.sort((a, b) => a.economy_price - b.economy_price);
    }

    setFlights(filteredFlights);
  };

  const cancelFlight = async (flightId: number) => {
    try {
      await axios.patch(`/api/schedules/${flightId}/`, { confirmed: false });
      setFlights((prevFlights) =>
        prevFlights.map((flight) =>
          flight.id === flightId ? { ...flight, confirmed: false } : flight
        )
      );
    } catch (error) {
      console.error("Error cancelling flight", error);
    }
  };

  const editFlight = (flightId: number) => {
    // Логика для редактирования рейса, например, переход на страницу редактирования
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="From Airport"
          value={filters.departureAirport}
          onChange={(e) => setFilters({ ...filters, departureAirport: e.target.value })}
        />
        <input
          type="text"
          placeholder="To Airport"
          value={filters.arrivalAirport}
          onChange={(e) => setFilters({ ...filters, arrivalAirport: e.target.value })}
        />
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
        <input
          type="text"
          placeholder="Flight Number"
          value={filters.flightNumber}
          onChange={(e) => setFilters({ ...filters, flightNumber: e.target.value })}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'price')}>
          <option value="date">Sort by Date</option>
          <option value="price">Sort by Price</option>
        </select>
        <button onClick={applyFilters}>Apply Filters</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>From</th>
            <th>To</th>
            <th>Flight Number</th>
            <th>Aircraft</th>
            <th>Economy Price</th>
            <th>Business Price</th>
            <th>First Class Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flights.map((flight) => (
            <tr key={flight.id} style={{ backgroundColor: !flight.confirmed ? '#f8d7da' : 'transparent' }}>
              <td>{flight.date}</td>
              <td>{flight.time}</td>
              <td>{flight.from_airport.name}</td>
              <td>{flight.to_airport.name}</td>
              <td>{flight.flight_number}</td>
              <td>{flight.aircraft.name}</td>
              <td>{flight.economy_price}</td>
              <td>{flight.business_price}</td>
              <td>{flight.first_class_price}</td>
              <td>{flight.confirmed ? 'Confirmed' : 'Cancelled'}</td>
              <td>
                <button onClick={() => editFlight(flight.id)}>Edit</button>
                <button onClick={() => cancelFlight(flight.id)} disabled={!flight.confirmed}>Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FlightScheduleManagement;
