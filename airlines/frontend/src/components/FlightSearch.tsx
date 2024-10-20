import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Schedule {
    id: number;
    date: string;
    flight_number: string;
    economy_price: number;
    business_price: number;
    first_class_price: number;
    confirmed: boolean;
    from_airport: { name: string };
    to_airport: { name: string };
}

const FlightSearch = () => {
    const [fromAirport, setFromAirport] = useState('');
    const [toAirport, setToAirport] = useState('');
    const [outboundDate, setOutboundDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    const [includeNearbyDays, setIncludeNearbyDays] = useState(false);
    const [outboundFlights, setOutboundFlights] = useState<Schedule[]>([]);
    const [returnFlights, setReturnFlights] = useState<Schedule[]>([]);
    const [airports, setAirports] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/airports/')
            .then(response => setAirports(response.data))
            .catch(error => console.error(error));
    }, []);

    const handleSearch = () => {
        axios.get('http://127.0.0.1:8000/api/schedules/search/', {
            params: {
                departure_airport: fromAirport,
                arrival_airport: toAirport,
                date: outboundDate,
                include_nearby_days: includeNearbyDays,
            },
        })
        .then(response => setOutboundFlights(response.data))
        .catch(error => {
            if (error.response.status === 404) {
                alert('Нет доступных рейсов на выбранную дату.');
            } else {
                console.error(error);
            }
        });

        if (isRoundTrip && returnDate) {
            axios.get('http://127.0.0.1:8000/api/schedules/search/', {
                params: {
                    departure_airport: toAirport,
                    arrival_airport: fromAirport,
                    date: returnDate,
                    include_nearby_days: includeNearbyDays,
                },
            })
            .then(response => setReturnFlights(response.data))
            .catch(error => {
                if (error.response.status === 404) {
                    alert('Нет доступных обратных рейсов на выбранную дату.');
                } else {
                    console.error(error);
                }
            });
        }
    };

    return (
        <div>
            <h2>Поиск рейсов</h2>
            <form>
                <div>
                    <label>Аэропорт вылета: </label>
                    <select value={fromAirport} onChange={e => setFromAirport(e.target.value)}>
                        <option value="">Выберите</option>
                        {airports.map(airport => (
                            <option key={airport.id} value={airport.id}>
                                {airport.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Аэропорт прибытия: </label>
                    <select value={toAirport} onChange={e => setToAirport(e.target.value)}>
                        <option value="">Выберите</option>
                        {airports.map(airport => (
                            <option key={airport.id} value={airport.id}>
                                {airport.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Дата вылета: </label>
                    <input type="date" value={outboundDate} onChange={e => setOutboundDate(e.target.value)} />
                </div>

                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={isRoundTrip}
                            onChange={e => setIsRoundTrip(e.target.checked)}
                        />
                        Обратный рейс
                    </label>
                </div>

                {isRoundTrip && (
                    <div>
                        <label>Дата обратного рейса: </label>
                        <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                    </div>
                )}

                <div>
                    <label>
                        <input 
                            type="checkbox" 
                            checked={includeNearbyDays} 
                            onChange={e => setIncludeNearbyDays(e.target.checked)} 
                        />
                        Искать рейсы ±3 дня от выбранных дат
                    </label>
                </div>

                <button type="button" onClick={handleSearch}>Поиск</button>
            </form>

            {outboundFlights.length > 0 && (
                <div>
                    <h3>Доступные рейсы туда</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Номер рейса</th>
                                <th>Аэропорт вылета</th>
                                <th>Аэропорт прибытия</th>
                                <th>Цена (эконом)</th>
                                <th>Цена (бизнес)</th>
                                <th>Цена (первый класс)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outboundFlights.map(schedule => (
                                <tr key={schedule.id}>
                                    <td>{schedule.date}</td>
                                    <td>{schedule.flight_number}</td>
                                    <td>{schedule.from_airport.name}</td>
                                    <td>{schedule.to_airport.name}</td>
                                    <td>{schedule.economy_price} руб.</td>
                                    <td>{schedule.business_price} руб.</td>
                                    <td>{schedule.first_class_price} руб.</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isRoundTrip && returnFlights.length > 0 && (
                <div>
                    <h3>Доступные обратные рейсы</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Номер рейса</th>
                                <th>Аэропорт вылета</th>
                                <th>Аэропорт прибытия</th>
                                <th>Цена (эконом)</th>
                                <th>Цена (бизнес)</th>
                                <th>Цена (первый класс)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnFlights.map(schedule => (
                                <tr key={schedule.id}>
                                    <td>{schedule.date}</td>
                                    <td>{schedule.flight_number}</td>
                                    <td>{schedule.from_airport.name}</td>
                                    <td>{schedule.to_airport.name}</td>
                                    <td>{schedule.economy_price} руб.</td>
                                    <td>{schedule.business_price} руб.</td>
                                    <td>{schedule.first_class_price} руб.</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FlightSearch;
