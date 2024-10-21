import axios from 'axios';
import React, { useState } from 'react';

interface Ticket {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    confirmed: Boolean;
    cabintypeid: number;
    userid: number;
    scheduleid: number;
    passport_number: string;
    passport_country: number;
    booking_reference: string;
}

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

const AmenitiesBuyPage: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]); // Для хранения данных о маршрутах
    const [bookingReference, setBookingReference] = useState<string>(''); // Стейт для номера бронирования
    const [errorMessage, setErrorMessage] = useState<string>(''); // Стейт для ошибок

    const handleSearch = () => {
        if (bookingReference.trim() === '') {
            setErrorMessage('Please enter a booking reference.');
            return;
        }

        // Запрос на получение данных о билетах по номеру бронирования
        axios.get('http://127.0.0.1:8000/api/tickets/search', {
            params: {
                booking_reference: bookingReference,
            },
        })
            .then(response => {
                const fetchedTickets = response.data;
                setTickets(fetchedTickets);
                setErrorMessage(''); // Очищаем сообщение об ошибке, если запрос успешен
                
                // Если билеты найдены, делаем запросы на получение маршрутов по scheduleid
                if (fetchedTickets.length > 0) {
                    const scheduleIds = fetchedTickets.map((ticket: Ticket) => ticket.scheduleid);
                    fetchSchedulesSequentially(scheduleIds); // Изменили вызов на последовательные запросы
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setErrorMessage('No ticket found with this booking reference.');
            });
    };

    // Функция для последовательного выполнения запросов для каждого scheduleid
    const fetchSchedulesSequentially = async (scheduleIds: number[]) => {
        const fetchedSchedules: Schedule[] = [];

        // Используем Promise.all чтобы сделать запросы последовательно
        for (const id of scheduleIds) {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/schedules/search-by-id`, {
                    params: { id }
                });
                fetchedSchedules.push(response.data); // Добавляем каждый маршрут в список
            } catch (error) {
                console.error(`Error fetching schedule with id ${id}:`, error);
            }
        }

        setSchedules(fetchedSchedules); // Устанавливаем все маршруты после завершения всех запросов
    };

    return (
        <div>
            {/* Поле ввода для номера бронирования */}
            <div>
                <label>Booking reference:</label>
                <input
                    type="text"
                    value={bookingReference}
                    onChange={(e) => setBookingReference(e.target.value)}
                    placeholder="Enter booking reference"
                />
                <button onClick={handleSearch}>OK</button>
            </div>

            {/* Вывод сообщения об ошибке, если оно есть */}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

            {/* Вывод данных о билетах, если они есть */}
            {tickets.length > 0 ? (
                <div>
                    <h2>Flight list:</h2>
                    <ul>
                        {tickets.map(ticket => (
                            <li key={ticket.id}>
                                {ticket.first_name} {ticket.last_name} - {ticket.booking_reference}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>No tickets available</p>
            )}

            {/* Вывод данных о маршрутах, если они есть */}
            {schedules.length > 0 ? (
                <div>
                    <h2>Schedule Information:</h2>
                    <ul>
                        {schedules.map(schedule => (
                            <li key={schedule.id}>
                                Flight: {schedule.flight_number}, Departure: {schedule.from_airport.name}, Arrival: {schedule.to_airport.name}, Date: {schedule.date}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                tickets.length > 0 && <p>No schedules available for these tickets.</p>
            )}

            {/* Остальная часть интерфейса */}
            <div style={{ marginTop: '10px', border: '1px solid black', padding: '10px' }}>
                <p>AMONIC Airlines Amenities</p>
                <div>
                    <div>
                        <input type="checkbox" checked readOnly /> Soft Drinks (Free)
                    </div>
                    <div>
                        <input type="checkbox" checked readOnly /> Wi-Fi 50 MB (Free)
                    </div>
                    <div>
                        <input type="checkbox" /> Next Seat Free ($30)
                    </div>
                    <div>
                        <input type="checkbox" /> Wi-Fi 250 MB ($50)
                    </div>
                    <div>
                        <input type="checkbox" /> Extra Bag ($15)
                    </div>
                    <div>
                        <input type="checkbox" /> Laptop Rental ($15)
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '10px' }}>
                <p>Items selected: [ $XX ]</p>
                <p>Duties and taxes: [ $XX ]</p>
                <p>Total payable: [ $XX ]</p>
            </div>

            <div style={{ marginTop: '10px' }}>
                <button>Save and Confirm</button>
                <button style={{ marginLeft: '10px' }}>Exit</button>
            </div>
        </div>
    );
};

export default AmenitiesBuyPage;
