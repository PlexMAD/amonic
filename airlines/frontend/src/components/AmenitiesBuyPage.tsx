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
    price: string;
    cabin_types: number[];
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

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/amenities/')
            .then(response => {
                setAmenities(response.data);
            })
            .catch(error => {
                console.error('Error fetching amenities:', error);
                setErrorMessage('Failed to fetch amenities.');
            });
    }, []);

    const handleSearch = () => {
        if (bookingReference.trim() === '') {
            setErrorMessage('Please enter a booking reference.');
            return;
        }

        axios.get('http://127.0.0.1:8000/api/tickets/search', {
            params: {
                booking_reference: bookingReference,
            },
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
                console.error('Error fetching data:', error);
                setErrorMessage('No ticket found with this booking reference.');
            });
    };

    const fetchSchedulesSequentially = async (scheduleIds: number[]) => {
        const fetchedSchedules: Schedule[] = [];

        for (const id of scheduleIds) {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/schedules/search-by-id`, {
                    params: { id }
                });
                fetchedSchedules.push(response.data);
            } catch (error) {
                console.error(`Error fetching schedule with id ${id}:`, error);
            }
        }

        setSchedules(fetchedSchedules);
    };

    const handleAmenityChange = (id: number, price: number) => {
        if (price > 0) {
            setSelectedAmenities((prevState) => ({
                ...prevState,
                [id]: !prevState[id]
            }));
        }
    };

    const calculateTotalPrice = () => {
        return amenities.reduce((total, amenity) => {
            const price = parseFloat(amenity.price);
            const isFreeForCabin = selectedTicket && amenity.cabin_types.includes(selectedTicket.cabintypeid);

            if (selectedAmenities[amenity.id] && price > 0 && !isFreeForCabin) {
                return total + price;
            }
            return total;
        }, 0);
    };

    const totalPrice = calculateTotalPrice();
    const tax = totalPrice * 0.05;
    const totalPayable = totalPrice + tax;
    const selectedCount = Object.values(selectedAmenities).filter(Boolean).length;

    const handleSaveAndConfirm = () => {
        if (!selectedTicket) {
            setErrorMessage('No ticket selected.');
            return;
        }

        const selectedAmenitiesList = amenities.filter(amenity => selectedAmenities[amenity.id]);
        
        selectedAmenitiesList.forEach(async (amenity) => {
            const price = parseFloat(amenity.price);
            const isFreeForCabin = selectedTicket && amenity.cabin_types.includes(selectedTicket.cabintypeid);
            const finalPrice = isFreeForCabin ? 0 : price + (price * 0.05); // Price with tax if applicable

            try {
                await axios.post('http://127.0.0.1:8000/api/amenitiestickets/', {
                    amenity: amenity.id,
                    ticket: selectedTicket.id,
                    price: finalPrice.toFixed(2),
                });
                console.log(`Amenity ${amenity.service} saved for ticket ${selectedTicket.id} with price ${finalPrice}`);
            } catch (error) {
                console.error(`Error saving amenity ${amenity.service}:`, error);
            }
        });
    };

    return (
        <div>
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

            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

            {selectedTicket && (
                <div>
                    <h3>Passenger Information:</h3>
                    <p>Full Name: {selectedTicket.first_name} {selectedTicket.last_name}</p>
                    <p>Passport Number: {selectedTicket.passport_number}</p>
                    <p>Cabin Type ID: {selectedTicket.cabintypeid}</p>
                </div>
            )}

            {tickets.length > 0 && (
                <div>
                    <h2>Select your flight:</h2>
                    <select onChange={(e) => setSelectedSchedule(Number(e.target.value))} value={selectedSchedule || ''}>
                        <option value="">Select a flight</option>
                        {schedules.map(schedule => (
                            <option key={schedule.id} value={schedule.id}>
                                Flight: {schedule.flight_number}, Departure: {schedule.from_airport.name}, Arrival: {schedule.to_airport.name}, Date: {schedule.date + " " + schedule.time}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedSchedule && (
                <div style={{ marginTop: '10px', border: '1px solid black', padding: '10px' }}>
                    <p>AMONIC Airlines Amenities</p>
                    <div>
                        {amenities.map(amenity => {
                            const price = parseFloat(amenity.price);
                            const isFreeForCabin = selectedTicket && amenity.cabin_types.includes(selectedTicket.cabintypeid);
                            const displayedPrice = isFreeForCabin ? 0 : price;

                            return (
                                <div key={amenity.id}>
                                    <input 
                                        type="checkbox" 
                                        checked={displayedPrice === 0 || !!selectedAmenities[amenity.id]} 
                                        disabled={displayedPrice === 0} 
                                        onChange={() => handleAmenityChange(amenity.id, displayedPrice)}
                                    /> 
                                    {amenity.service} {displayedPrice > 0 ? `($${displayedPrice})` : '(Free)'}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedSchedule && (
                <div style={{ marginTop: '10px' }}>
                    <p>Items selected: {selectedCount}</p>
                    <p>Duties and taxes: ${tax.toFixed(2)}</p>
                    <p>Total payable: ${totalPayable.toFixed(2)}</p>
                </div>
            )}

            <div style={{ marginTop: '10px' }}>
                <button onClick={handleSaveAndConfirm}>Save and Confirm</button>
                <button style={{ marginLeft: '10px' }}>Exit</button>
            </div>
        </div>
    );
};

export default AmenitiesBuyPage;
