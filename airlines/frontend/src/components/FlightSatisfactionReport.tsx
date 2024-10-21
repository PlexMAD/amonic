import React, { useEffect, useState } from 'react';
import '../index.css'; 

interface ArrivalAirport {
    id: number;
    iata_code: string;
    name: string;
    countryid: number;
}

interface TravelClass {
    id: number;
    name: 'Economy' | 'Business' | 'First Class';
}

interface Survey {
    id: number;
    departure_airport: ArrivalAirport;
    arrival_airport: ArrivalAirport;
    travel_class: TravelClass;
    age: number;
    gender: 'M' | 'F';
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    survey_month: string;
}

const FlightSatisfactionReport: React.FC = () => {
    const [genderCount, setGenderCount] = useState<{ male: number; female: number }>({ male: 0, female: 0 });
    const [ageCategories, setAgeCategories] = useState<{ '18-24': number; '25-39': number; '40-59': number; '60+': number }>({ '18-24': 0, '25-39': 0, '40-59': 0, '60+': 0 });
    const [flightClasses, setFlightClasses] = useState<{ Economy: number; Business: number; 'First Class': number }>({ Economy: 0, Business: 0, 'First Class': 0 });
    const [arrivalAirports, setArrivalAirports] = useState<{ [key: string]: number }>({});
    const [showFullReport, setShowFullReport] = useState(false);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/surveys0/')
            .then(response => response.json())
            .then(data => {
                processSurveyData(data);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const processSurveyData = (surveyData: Survey[]) => {
        let maleCount = 0;
        let femaleCount = 0;
        let ageCatCount = { '18-24': 0, '25-39': 0, '40-59': 0, '60+': 0 };
        let flightClassCount = { Economy: 0, Business: 0, 'First Class': 0 };
        let airportCount: { [key: string]: number } = {};

        surveyData.forEach(survey => {
            if (survey.gender === 'M') {
                maleCount++;
            } else if (survey.gender === 'F') {
                femaleCount++;
            }

            const age = survey.age;
            if (age >= 18 && age <= 24) {
                ageCatCount['18-24']++;
            } else if (age >= 25 && age <= 39) {
                ageCatCount['25-39']++;
            } else if (age >= 40 && age <= 59) {
                ageCatCount['40-59']++;
            } else if (age >= 60) {
                ageCatCount['60+']++;
            }

            const flightClass = survey.travel_class.name as keyof typeof flightClassCount;
            flightClassCount[flightClass]++;

            const arrivalAirport = survey.arrival_airport.name;
            if (airportCount[arrivalAirport]) {
                airportCount[arrivalAirport]++;
            } else {
                airportCount[arrivalAirport] = 1;
            }
        });

        setGenderCount({ male: maleCount, female: femaleCount });
        setAgeCategories(ageCatCount);
        setFlightClasses(flightClassCount);
        setArrivalAirports(airportCount);
    };

    return (
        <div className="report">
            <header className="report__header">
                <h1 className="report__title">Отчёт о удовлетворенности полетом</h1>
                <h2 className="report__subtitle">Сводный отчёт</h2>
            </header>
            <section className="report__section">
                <h3 className="report__section-title">Распределение по полу</h3>
                <table className="report__table">
                    <thead>
                        <tr className="report__table-row report__table-row--header">
                            <th className="report__table-header">Пол</th>
                            <th className="report__table-header">Количество</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="report__table-row">
                            <td className="report__table-cell">Мужчины</td>
                            <td className="report__table-cell">{genderCount.male}</td>
                        </tr>
                        <tr className="report__table-row">
                            <td className="report__table-cell">Женщины</td>
                            <td className="report__table-cell">{genderCount.female}</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            <section className="report__section">
                <h3 className="report__section-title">Распределение по возрасту</h3>
                <ul className="report__list">
                    {Object.entries(ageCategories).map(([category, count]) => (
                        <li key={category} className="report__list-item">{category}: {count}</li>
                    ))}
                </ul>
            </section>
            <section className="report__section">
                <h3 className="report__section-title">Классы перелётов</h3>
                <ul className="report__list">
                    {Object.entries(flightClasses).map(([flightClass, count]) => (
                        <li key={flightClass} className="report__list-item">{flightClass}: {count}</li>
                    ))}
                </ul>
            </section>
            <section className="report__section">
                <h3 className="report__section-title">Аэропорты прибытия</h3>
                <ul className="report__list">
                    {Object.entries(arrivalAirports).map(([airport, count]) => (
                        <li key={airport} className="report__list-item">{airport}: {count}</li>
                    ))}
                </ul>
            </section>
            <footer className="report__footer">
                <button className="report__button"><a style={{ textDecoration: 'none', color: 'white' }} href="/full_report">Показать полный отчёт</a></button>
            </footer>
        </div>
    );
};

export default FlightSatisfactionReport;