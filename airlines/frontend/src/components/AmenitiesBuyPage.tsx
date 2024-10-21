import axios from 'axios';
import React, { useState, useEffect } from 'react';

interface Ticket {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    confirmed: boolean;
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
    time: string;
}

interface Amenity {
    id: number;
    service: string;
    price: number; // Цена удобства как число
}

const AmenitiesBuyPage: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [bookingReference, setBookingReference] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<{ [key: number]: boolean }>({});
    const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);

    // Пример цен для каждой услуги
    const amenityPrices: { [key: number]: number } = {
        1: 0,  // wifi(25mb) - Бесплатно
        2: 0,  // soft drinks - Бесплатно
        3: 50, // wifi(250mb) - 50$
        4: 15, // extra bag - 15$
        5: 15, // laptop - 15$
        6: 5   // blanket - 5$
    };

    // Загрузка списка удобств
    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/amenities/')
            .then(response => {
                setAmenities(response.data);
            })
            .catch(error => {
                console.error('Ошибка при загрузке удобств:', error);
                setErrorMessage('Не удалось загрузить список удобств.');
            });
    }, []);

    // Поиск билета по номеру бронирования
    const handleSearch = () => {
        if (bookingReference.trim() === '') {
            setErrorMessage('Введите номер бронирования.');
            return;
        }

        axios.get('http://127.0.0.1:8000/api/tickets/search', {
            params: { booking_reference: bookingReference },
        })
        .then(response => {
            const fetchedTickets = response.data;
            setTickets(fetchedTickets);
            setErrorMessage('');

            if (fetchedTickets.length > 0) {
                const scheduleIds = fetchedTickets.map((ticket: Ticket) => ticket.scheduleid);
                fetchSchedulesSequentially(scheduleIds);
                setSelectedTicket(fetchedTickets[0]);
            }
        })
        .catch(error => {
            console.error('Ошибка при поиске билета:', error);
            setErrorMessage('Билет с таким номером не найден.');
        });
    };

    // Загрузка расписания по ID рейсов
    const fetchSchedulesSequentially = async (scheduleIds: number[]) => {
        const fetchedSchedules: Schedule[] = [];
        for (const id of scheduleIds) {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/schedules/search-by-id`, { params: { id } });
                fetchedSchedules.push(response.data);
            } catch (error) {
                console.error(`Ошибка при загрузке расписания с ID ${id}:`, error);
            }
        }
        setSchedules(fetchedSchedules);
    };

    // Обработка выбора удобства (чекбокс)
    const handleAmenityChange = (id: number) => {
        setSelectedAmenities((prevState) => ({
            ...prevState,
            [id]: !prevState[id] // Переключение состояния выбранности
        }));
    };

    // Подсчет итоговой стоимости на основе выбранных удобств
    const calculateTotalPrice = () => {
        return Object.keys(selectedAmenities).reduce((total, amenityId) => {
            if (selectedAmenities[Number(amenityId)]) {
                return total + amenityPrices[Number(amenityId)]; // Добавление цены выбранного удобства
            }
            return total;
        }, 0);
    };

    // Итоговая сумма и налоги
    const totalPrice = calculateTotalPrice();
    const tax = totalPrice * 0.05;
    const totalPayable = totalPrice + tax;
    const selectedCount = Object.values(selectedAmenities).filter(Boolean).length;

    // Обработка сохранения выбранных удобств
    const handleSaveAndConfirm = () => {
        if (!selectedTicket) {
            setErrorMessage('Вы не выбрали билет.');
            return;
        }

        const selectedAmenitiesList = amenities.filter(amenity => selectedAmenities[amenity.id]);
        
        selectedAmenitiesList.forEach(async (amenity) => {
            const price = amenityPrices[amenity.id];
            const finalPrice = price + (price * 0.05); // Цена с учетом налога

            try {
                await axios.post('http://127.0.0.1:8000/api/amenitiestickets/', {
                    amenity: amenity.id,
                    ticket: selectedTicket.id,
                    price: finalPrice.toFixed(2),
                });
                console.log(`Услуга ${amenity.service} добавлена к билету ${selectedTicket.id} с ценой ${finalPrice}`);
            } catch (error) {
                console.error(`Ошибка при сохранении услуги ${amenity.service}:`, error);
            }
        });

        window.location.reload(); // Перезагрузка страницы после сохранения
    };

    return (
        <div className="amenities-page">
            <div className="amenities-page__search">
                <label>Номер бронирования:</label>
                <input
                    type="text"
                    value={bookingReference}
                    onChange={(e) => setBookingReference(e.target.value)}
                    placeholder="Введите номер бронирования"
                />
                <button onClick={handleSearch}>OK</button>
            </div>

            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

            {selectedTicket && (
                <div className="amenities-page__passenger-info">
                    <h3>Информация о пассажире:</h3>
                    <p>Полное имя: {selectedTicket.first_name} {selectedTicket.last_name}</p>
                    <p>Номер паспорта: {selectedTicket.passport_number}</p>
                    <p>Класс обслуживания: {selectedTicket.cabintypeid}</p>
                </div>
            )}

            {tickets.length > 0 && (
                <div className="amenities-page__flight-select">
                    <h2>Выберите рейс:</h2>
                    <select onChange={(e) => setSelectedSchedule(Number(e.target.value))} value={selectedSchedule || ''}>
                        <option value="">Выберите рейс</option>
                        {schedules.map(schedule => (
                            <option key={schedule.id} value={schedule.id}>
                                Рейс: {schedule.flight_number}, Вылет: {schedule.from_airport.name}, Прибытие: {schedule.to_airport.name}, Дата: {schedule.date + " " + schedule.time}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedSchedule && (
                <div className="amenities-page__amenities-list">
                    <p>Дополнительные услуги AMONIC Airlines</p>
                    <div>
                        {amenities.map(amenity => {
                            const price = amenityPrices[amenity.id];
                            return (
                                <div key={amenity.id} className="amenities-page__amenity">
                                    <input
                                        type="checkbox"
                                        checked={!!selectedAmenities[amenity.id]}
                                        onChange={() => handleAmenityChange(amenity.id)}
                                    />
                                    {amenity.service} {price > 0 ? `(${price} $)` : '(Бесплатно)'}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedSchedule && (
                <div className="amenities-page__summary">
                    <p>Выбранных услуг: {selectedCount}</p>
                    <p>Налоги и сборы: {tax.toFixed(2)} $</p>
                    <p>Итого к оплате: {totalPayable.toFixed(2)} $</p>
                </div>
            )}

            <div className="amenities-page__buttons">
                <button onClick={handleSaveAndConfirm}>Сохранить и подтвердить</button>
            </div>
        </div>
    );
};

export default AmenitiesBuyPage;
