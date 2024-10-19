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
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
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
    } else {
      filteredFlights.sort((a, b) => a.economy_price - b.economy_price);
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
    <div>
      <div>
        <select
          value={filters.departureAirport}
          onChange={(e) => setFilters({ ...filters, departureAirport: e.target.value })}
        >
          <option value="">Select Departure Airport</option>
          {airports.map((airport) => (
            <option key={airport.id} value={airport.id}>
              {airport.name}
            </option>
          ))}
        </select>

        <select
          value={filters.arrivalAirport}
          onChange={(e) => setFilters({ ...filters, arrivalAirport: e.target.value })}
          disabled={!filters.departureAirport} // Disable if no departure airport is selected
        >
          <option value="">Select Arrival Airport</option>
          {airports
            .filter((airport) => airport.id !== parseInt(filters.departureAirport)) // Filter out the selected departure airport
            .map((airport) => (
              <option key={airport.id} value={airport.id}>
                {airport.name}
              </option>
            ))}
        </select>

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
                <button onClick={() => handleEditFlight(flight)}>Edit</button>
                <button onClick={() => cancelFlight(flight.id)} disabled={!flight.confirmed}>Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && selectedFlight && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Flight</h3>
            <label>Date:</label>
            <input type="date" name="date" value={selectedFlight.date} onChange={handleInputChange} />

            <label>Time:</label>
            <input type="time" name="time" value={selectedFlight.time} onChange={handleInputChange} />

            <label>Economy Price:</label>
            <input
              type="number"
              name="economy_price"
              value={selectedFlight.economy_price}
              onChange={handleInputChange}
            />

            <button onClick={handleSave}>Save</button>
            <button onClick={handleCloseModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightScheduleManagement;
