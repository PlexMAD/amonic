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
    const [passengerList, setPassengerList] = useState<Passenger[]>([{} as Passenger]); // Начальное значение с одним пассажиром
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
            has_return_trip: isRoundTrip // Новый параметр
        };

        const token = localStorage.getItem('access_token');

        axios.post('http://127.0.0.1:8000/api/create-ticket/', bookingData, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
        .then(response => {
            alert('Бронирование успешно создано!');
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

    const handlePassengerCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const count = parseInt(e.target.value);
        setPassengerCount(count);
        
        // Обновляем список пассажиров при изменении количества
        const updatedPassengerList = Array.from({ length: count }, (_, index) => passengerList[index] || ({} as Passenger));
        setPassengerList(updatedPassengerList);
    };

    const handleAddPassenger = () => {
        setPassengerCount(prevCount => prevCount + 1);
        setPassengerList(prevList => [...prevList, {} as Passenger]); // Добавление пустого объекта для нового пассажира
    };

    const handleRemovePassenger = () => {
        if (passengerCount > 1) {
            setPassengerCount(prevCount => prevCount - 1);
            setPassengerList(prevList => prevList.slice(0, -1)); // Удаление последнего пассажира
        }
    };

    const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
        const newList = [...passengerList];
        newList[index] = { ...newList[index], [field]: value };
        setPassengerList(newList);
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

                <div>
                    <label>Количество пассажиров: </label>
                    <select value={passengerCount} onChange={handlePassengerCountChange}>
                        {[1, 2, 3, 4, 5].map(count => (
                            <option key={count} value={count}>{count}</option>
                        ))}
                    </select>
                </div>

                <button type="button" onClick={handleSearch}>Поиск рейсов</button>
            </form>

            <h3>Доступные рейсы</h3>
            <h4>Вылет</h4>
            <ul>
                {outboundFlights.map(flight => (
                    <li key={flight.id}>
                        <span>{flight.date} - {flight.flight_number} ({flight.from_airport.name} → {flight.to_airport.name})</span>
                        <span> Цена: {calculatePrice(flight.economy_price)} Руб.</span>
                        <button onClick={() => handleSelectOutboundFlight(flight)}>Выбрать</button>
                    </li>
                ))}
            </ul>

            {isRoundTrip && (
                <>
                    <h4>Обратный рейс</h4>
                    <ul>
                        {returnFlights.map(flight => (
                            <li key={flight.id}>
                                <span>{flight.date} - {flight.flight_number} ({flight.from_airport.name} → {flight.to_airport.name})</span>
                                <span> Цена: {calculatePrice(flight.economy_price)} Руб.</span>
                                <button onClick={() => handleSelectReturnFlight(flight)}>Выбрать</button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <button onClick={handleBooking} disabled={!selectedOutboundFlight}>Забронировать рейс</button>

            {showBookingForm && (
                <div>
                    <h3>Форма бронирования</h3>
                    {Array.from({ length: passengerCount }).map((_, index) => (
                        <div key={index}>
                            <h4>Пассажир {index + 1}</h4>
                            <input type="text" placeholder="Имя" onChange={e => handlePassengerChange(index, 'firstName', e.target.value)} />
                            <input type="text" placeholder="Фамилия" onChange={e => handlePassengerChange(index, 'lastName', e.target.value)} />
                            <input type="date" placeholder="Дата рождения" onChange={e => handlePassengerChange(index, 'birthDate', e.target.value)} />
                            <input type="text" placeholder="Номер паспорта" onChange={e => handlePassengerChange(index, 'passportNumber', e.target.value)} />
                            <select onChange={e => handlePassengerChange(index, 'passportCountry', e.target.value)}>
                                <option value="">Страна паспорта</option>
                                {countries.map(country => (
                                    <option key={country.id} value={country.name}>{country.name}</option>
                                ))}
                            </select>
                            <input type="text" placeholder="Телефон" onChange={e => handlePassengerChange(index, 'phone', e.target.value)} />
                            <input type="email" placeholder="Email" onChange={e => handlePassengerChange(index, 'email', e.target.value)} />
                        </div>
                    ))}
                    <button onClick={handleAddPassenger}>Добавить пассажира</button>
                    <button onClick={handleRemovePassenger} disabled={passengerCount <= 1}>Удалить пассажира</button>
                    <button onClick={handleConfirmBooking}>Подтвердить бронирование</button>
                </div>
            )}
        </div>
    );
};

export default FlightSearch;
