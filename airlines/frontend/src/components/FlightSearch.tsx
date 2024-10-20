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

interface Passenger {
    firstName: string;
    lastName: string;
    birthDate: string;
    passportNumber: string;
    passportCountry: string;
    phone: string;
    email: string;
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
    const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<Schedule | null>(null);
    const [selectedReturnFlight, setSelectedReturnFlight] = useState<Schedule | null>(null);
    const [passengerCount, setPassengerCount] = useState(1);
    const [passengerList, setPassengerList] = useState<Passenger[]>([]);
    const [airports, setAirports] = useState<{ id: number; name: string }[]>([]);

    const [showBookingForm, setShowBookingForm] = useState(false);
    const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
    const [cabinType, setCabinType] = useState('economy');

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/countries/')
            .then(response => setCountries(response.data))
            .catch(error => console.error(error));
    }, []);


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

    const handleSelectOutboundFlight = (flight: Schedule) => {
        setSelectedOutboundFlight(flight);
    };

    const handleSelectReturnFlight = (flight: Schedule) => {
        setSelectedReturnFlight(flight);
    };

    const handleBooking = () => {
        setShowBookingForm(true);
    };
    const handleConfirmBooking = () => {
        if (!selectedOutboundFlight) return;

        const bookingData = {
            flight: selectedOutboundFlight.id,
            passengers: passengerList.map(passenger => ({
                first_name: passenger.firstName,
                last_name: passenger.lastName,
                birth_date: passenger.birthDate,
                passport_number: passenger.passportNumber,
                passport_country: passenger.passportCountry,
                phone: passenger.phone,
                email: passenger.email,
            })),
            cabintypeid: cabinType === 'economy' ? 1 : cabinType === 'business' ? 2 : 3,
            returnFlight: isRoundTrip && selectedReturnFlight ? selectedReturnFlight.id : null,
        };

        const token = localStorage.getItem('access_token');


        const bookingRequests = [];


        bookingRequests.push(
            axios.post('http://127.0.0.1:8000/api/create-ticket/', bookingData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
        );


        if (isRoundTrip && selectedReturnFlight) {
            const returnBookingData = {
                flight: selectedReturnFlight.id,
                passengers: passengerList.map(passenger => ({
                    first_name: passenger.firstName,
                    last_name: passenger.lastName,
                    birth_date: passenger.birthDate,
                    passport_number: passenger.passportNumber,
                    passport_country: passenger.passportCountry,
                    phone: passenger.phone,
                    email: passenger.email,
                })),
                cabintypeid: cabinType === 'economy' ? 1 : cabinType === 'business' ? 2 : 3,
                returnFlight: null,
            };

            bookingRequests.push(
                axios.post('http://127.0.0.1:8000/api/create-ticket/', returnBookingData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                })
            );
        }

        Promise.all(bookingRequests)
            .then(responses => {
                const bookingNumbers = responses.map(response => response.data.booking_number);
                alert('Бронирование успешно создано! Номера бронирования: ' + bookingNumbers.join(', '));
                setShowBookingForm(false);
            })
            .catch(error => {
                console.error('Ошибка при бронировании:', error);
                alert('Ошибка при создании бронирования. Попробуйте еще раз.');
            });
    };


    const calculatePrice = (economyPrice: number) => {
        if (cabinType === 'business') {
            return Math.round(economyPrice * 1.35);
        } else if (cabinType === 'first_class') {
            const businessPrice = Math.round(economyPrice * 1.35);
            return Math.round(businessPrice * 1.30);
        }
        return economyPrice;
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
                <div>
                    <label>Тип кабины: </label>
                    <select value={cabinType} onChange={e => setCabinType(e.target.value)}>
                        <option value="economy">Эконом</option>
                        <option value="business">Бизнес</option>
                        <option value="first_class">Первый класс</option>
                    </select>
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
                                <th>Цена</th>
                                <th>Выбрать</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outboundFlights.map(flight => (
                                <tr key={flight.id}>
                                    <td>{flight.date}</td>
                                    <td>{flight.flight_number}</td>
                                    <td>{flight.from_airport.name}</td>
                                    <td>{flight.to_airport.name}</td>
                                    <td>{calculatePrice(flight.economy_price)} руб.</td>
                                    <td>
                                        <button onClick={() => handleSelectOutboundFlight(flight)}>
                                            {selectedOutboundFlight?.id === flight.id ? 'Выбран' : 'Выбрать'}
                                        </button>
                                    </td>
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
                                <th>Цена</th>
                                <th>Выбрать</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnFlights.map(flight => (
                                <tr key={flight.id}>
                                    <td>{flight.date}</td>
                                    <td>{flight.flight_number}</td>
                                    <td>{flight.from_airport.name}</td>
                                    <td>{flight.to_airport.name}</td>
                                    <td>{calculatePrice(flight.economy_price)} руб.</td>
                                    <td>
                                        <button onClick={() => handleSelectReturnFlight(flight)}>
                                            {selectedReturnFlight?.id === flight.id ? 'Выбран' : 'Выбрать'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div>
                <label>Количество пассажиров: </label>
                <input
                    type="number"
                    value={passengerCount}
                    min={1}
                    onChange={e => setPassengerCount(Number(e.target.value))}
                />
            </div>

            <button onClick={handleBooking} disabled={!selectedOutboundFlight || (isRoundTrip && !selectedReturnFlight)}>
                Забронировать
            </button>

            {showBookingForm && (
                <div>
                    <h2>Оформление бронирования</h2>
                    <div>
                        <h3>Детали вылета</h3>
                        <p>{`Вылет: ${selectedOutboundFlight?.from_airport.name} - Прибытие: ${selectedOutboundFlight?.to_airport.name} - Дата: ${selectedOutboundFlight?.date}`}</p>
                        {isRoundTrip && selectedReturnFlight && (
                            <p>{`Обратный рейс: ${selectedReturnFlight.from_airport.name} - ${selectedReturnFlight.to_airport.name} - Дата: ${selectedReturnFlight.date}`}</p>
                        )}
                    </div>


                    <h3>Детали пассажиров</h3>
                    <form>
                        {Array.from({ length: passengerCount }, (_, index) => (
                            <div key={index}>
                                <h3>Пассажир {index + 1}</h3>
                                <label>Имя: </label>
                                <input
                                    type="text"
                                    value={passengerList[index]?.firstName || ''}
                                    onChange={e => {
                                        const updatedPassenger = { ...passengerList[index], firstName: e.target.value };
                                        const updatedList = [...passengerList];
                                        updatedList[index] = updatedPassenger;
                                        setPassengerList(updatedList);
                                    }}
                                />
                                <label>Фамилия: </label>
                                <input
                                    type="text"
                                    value={passengerList[index]?.lastName || ''}
                                    onChange={e => {
                                        const updatedPassenger = { ...passengerList[index], lastName: e.target.value };
                                        const updatedList = [...passengerList];
                                        updatedList[index] = updatedPassenger;
                                        setPassengerList(updatedList);
                                    }}
                                />
                                <label>Дата рождения: </label>
                                <input
                                    type="date"
                                    value={passengerList[index]?.birthDate || ''}
                                    onChange={e => {
                                        const updatedPassenger = { ...passengerList[index], birthDate: e.target.value };
                                        const updatedList = [...passengerList];
                                        updatedList[index] = updatedPassenger;
                                        setPassengerList(updatedList);
                                    }}
                                />
                                <label>Номер паспорта: </label>
                                <input
                                    type="text"
                                    value={passengerList[index]?.passportNumber || ''}
                                    onChange={e => {
                                        const updatedPassenger = { ...passengerList[index], passportNumber: e.target.value };
                                        const updatedList = [...passengerList];
                                        updatedList[index] = updatedPassenger;
                                        setPassengerList(updatedList);
                                    }}
                                />
                                <label>Страна паспорта: </label>
                                <select
                                    value={passengerList[index]?.passportCountry || ''}
                                    onChange={e => {
                                        const updatedPassenger = { ...passengerList[index], passportCountry: e.target.value };
                                        const updatedList = [...passengerList];
                                        updatedList[index] = updatedPassenger;
                                        setPassengerList(updatedList);
                                    }}
                                >
                                    <option value="">Выберите</option>
                                    {countries.map(country => (
                                        <option key={country.id} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                                <label>Email: </label>
                                <input
                                    type="email"
                                    value={passengerList[index]?.email || ''}
                                    onChange={e => {
                                        const updatedPassenger = { ...passengerList[index], email: e.target.value };
                                        const updatedList = [...passengerList];
                                        updatedList[index] = updatedPassenger;
                                        setPassengerList(updatedList);
                                    }}
                                />
                                <label>Телефон: </label>
                                <input
                                    type="text"
                                    value={passengerList[index]?.phone || ''}
                                    onChange={e => {
                                        const updatedPassenger = { ...passengerList[index], phone: e.target.value };
                                        const updatedList = [...passengerList];
                                        updatedList[index] = updatedPassenger;
                                        setPassengerList(updatedList);
                                    }}
                                />
                            </div>
                        ))}

                        <div>
                            <button type="button" onClick={() => setPassengerCount(passengerCount + 1)}>
                                Добавить пассажира
                            </button>
                            <button
                                type="button"
                                onClick={() => setPassengerCount(passengerCount > 1 ? passengerCount - 1 : 1)}
                                disabled={passengerCount <= 1}
                            >
                                Удалить пассажира
                            </button>
                        </div>

                        <button type="button" onClick={() => setShowBookingForm(false)}>
                            Закрыть
                        </button>
                    </form>


                    <button onClick={handleConfirmBooking}>Подтвердить бронирование</button>

                </div>
            )}
        </div>
    );
};

export default FlightSearch;
