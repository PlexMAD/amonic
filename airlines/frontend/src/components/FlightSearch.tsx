import React, { useState } from 'react';

interface Flight {
    date: string;
    flightNumber: string;
    cabinPrice: number;
    stops: number;
}

const FlightSearch = () => {
    const [fromAirport, setFromAirport] = useState('');
    const [toAirport, setToAirport] = useState('');
    const [isReturn, setIsReturn] = useState(false);
    const [cabinType, setCabinType] = useState('Economy');
    const [outboundDate, setOutboundDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [flights, setFlights] = useState<Flight[]>([]);
    const [passengers, setPassengers] = useState<number>(1);

    const handleSearch = () => {
        const foundFlights: Flight[] = [
            { date: '11/10/2024', flightNumber: 'AB123', cabinPrice: 540, stops: 0 },
            { date: '11/10/2024', flightNumber: 'CD456', cabinPrice: 560, stops: 1 }
        ];
        setFlights(foundFlights);
    };

    return (
        <div>
            <h2>Search Parameters</h2>
            <form>
                <div>
                    <label>From: </label>
                    <select value={fromAirport} onChange={e => setFromAirport(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Airport1">Airport 1</option>
                        <option value="Airport2">Airport 2</option>
                    </select>
                </div>

                <div>
                    <label>To: </label>
                    <select value={toAirport} onChange={e => setToAirport(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Airport1">Airport 1</option>
                        <option value="Airport2">Airport 2</option>
                    </select>
                </div>

                <div>
                    <label>
                        <input type="checkbox" checked={isReturn} onChange={e => setIsReturn(e.target.checked)} />
                        Return
                    </label>
                </div>

                <div>
                    <label>Cabin Type: </label>
                    <select value={cabinType} onChange={e => setCabinType(e.target.value)}>
                        <option value="Economy">Economy</option>
                        <option value="Business">Business</option>
                        <option value="First">First</option>
                    </select>
                </div>

                <div>
                    <label>Outbound: </label>
                    <input type="date" value={outboundDate} onChange={e => setOutboundDate(e.target.value)} />
                </div>

                {isReturn && (
                    <div>
                        <label>Return: </label>
                        <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                    </div>
                )}

                <button type="button" onClick={handleSearch}>Apply</button>
            </form>

            <h3>Outbound flight details</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Flight Number</th>
                        <th>Cabin Price</th>
                        <th>Number of stops</th>
                    </tr>
                </thead>
                <tbody>
                    {flights.map((flight, index) => (
                        <tr key={index}>
                            <td>{flight.date}</td>
                            <td>{flight.flightNumber}</td>
                            <td>${flight.cabinPrice}</td>
                            <td>{flight.stops}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3>Confirm booking for</h3>
            <div>
                <label>Passengers: </label>
                <input 
                    type="number" 
                    value={passengers} 
                    onChange={e => setPassengers(Number(e.target.value))} 
                    min="1" 
                />
                <button>Book flight</button>
            </div>
        </div>
    );
};

export default FlightSearch;
