import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Импорт Bootstrap стилей

// Определяем интерфейсы для данных опроса
interface ArrivalAirport {
    id: number;
    iata_code: string;
    name: string;
    countryid: number;
}

interface TravelClass {
    id: number;
    name: 'Economy' | 'Business' | 'First Class'; // Обновлено на 'First Class'
}

interface Survey {
    id: number;
    departure_airport: ArrivalAirport;
    arrival_airport: ArrivalAirport;
    travel_class: TravelClass;
    age: number;
    gender: 'M' | 'F'; // Учитываем только Male (M) и Female (F)
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
    const [fullReport, setFullReport] = useState<any>(null); // Изначально null
    const [showFullReport, setShowFullReport] = useState(false);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/surveys0/')
            .then(response => response.json())
            .then(data => {
                processSurveyData(data);
                const report = processFullReportData(data);
                setFullReport(report); // Устанавливаем данные отчета
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
            // Gender count
            if (survey.gender === 'M') {
                maleCount++;
            } else if (survey.gender === 'F') {
                femaleCount++;
            }

            // Age category count
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

            // Flight class count
            const flightClass = survey.travel_class.name as keyof typeof flightClassCount; // Приведение типа
            if (flightClassCount[flightClass] !== undefined) {
                flightClassCount[flightClass]++;
            }

            // Arrival airport count
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

    const processFullReportData = (data: Survey[]) => {
        // Здесь вы пишете логику для обработки полного отчета, 
        // подсчитываете ответы на вопросы и формируете объект для рендеринга таблицы.
        let report = {
            q1: { outstanding: 0, veryGood: 0, good: 0, adequate: 0, needsImprovement: 0, poor: 0, dontKnow: 0 },
            q2: { outstanding: 0, veryGood: 0, good: 0, adequate: 0, needsImprovement: 0, poor: 0, dontKnow: 0 },
            q3: { outstanding: 0, veryGood: 0, good: 0, adequate: 0, needsImprovement: 0, poor: 0, dontKnow: 0 },
            q4: { outstanding: 0, veryGood: 0, good: 0, adequate: 0, needsImprovement: 0, poor: 0, dontKnow: 0 }
        };

        // Пример обработки данных и подсчета значений (можно доработать под вашу логику):
        data.forEach(survey => {
            // Логика для обработки каждого вопроса q1, q2, q3, q4
            // Например:
            if (survey.q1 === 7) report.q1.outstanding++;
            else if (survey.q1 === 6) report.q1.veryGood++;
            else if (survey.q1 === 5) report.q1.good++;
            // И так далее для всех вопросов q2, q3, q4
        });

        return report;
    };

    const renderReportTable = (reportData: any) => {
        if (!reportData || Object.keys(reportData).length === 0) {
            return <p>No data available</p>; // Если данных нет, выводим сообщение
        }

        // Пример рендеринга таблицы с результатами
        return (
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Question</th>
                        <th>Outstanding</th>
                        <th>Very Good</th>
                        <th>Good</th>
                        <th>Adequate</th>
                        <th>Needs Improvement</th>
                        <th>Poor</th>
                        <th>Don't Know</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(reportData).map((question, idx) => (
                        <tr key={idx}>
                            <td>{question}</td>
                            <td>{reportData[question].outstanding}</td>
                            <td>{reportData[question].veryGood}</td>
                            <td>{reportData[question].good}</td>
                            <td>{reportData[question].adequate}</td>
                            <td>{reportData[question].needsImprovement}</td>
                            <td>{reportData[question].poor}</td>
                            <td>{reportData[question].dontKnow}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="container">
            <h1>Flight Satisfaction Report</h1>
            <h2>Summary Report</h2>
            <table className="table">
                <thead>
                    <tr>
                        <th>Gender</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Male</td>
                        <td>{genderCount.male}</td>
                    </tr>
                    <tr>
                        <td>Female</td>
                        <td>{genderCount.female}</td>
                    </tr>
                </tbody>
            </table>

            <h3>Age Distribution</h3>
            <ul>
                {Object.entries(ageCategories).map(([category, count]) => (
                    <li key={category}>{category}: {count}</li>
                ))}
            </ul>

            <h3>Flight Classes</h3>
            <ul>
                {Object.entries(flightClasses).map(([flightClass, count]) => (
                    <li key={flightClass}>{flightClass}: {count}</li>
                ))}
            </ul>

            <h3>Arrival Airports</h3>
            <ul>
                {Object.entries(arrivalAirports).map(([airport, count]) => (
                    <li key={airport}>{airport}: {count}</li>
                ))}
            </ul>

            <button className="btn btn-primary" onClick={() => setShowFullReport(true)}><a href='full_report'>Show Full Report</a></button>
        </div>
    );
};

export default FlightSatisfactionReport;
