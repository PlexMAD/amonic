import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Airport {
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
    departure_airport: Airport;
    arrival_airport: Airport;
    travel_class: TravelClass;
    age: number;
    gender: 'M' | 'F';
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    survey_month: string;
}

const FullReport: React.FC = () => {
    const [fullReport, setFullReport] = useState<any[]>([]);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/surveys0/')
            .then(response => response.json())
            .then(data => processFullReportData(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    const processFullReportData = (surveyData: Survey[]) => {
        const report: any[] = [
            { question: 'Please rate our aircraft', answers: Array(6).fill(0).map(() => Array(7).fill(0)) },
            { question: 'How would you rate our flight attendants', answers: Array(6).fill(0).map(() => Array(7).fill(0)) },
            { question: 'How would you rate our inflight entertainment', answers: Array(6).fill(0).map(() => Array(7).fill(0)) },
            { question: 'Please rate the ticket price', answers: Array(6).fill(0).map(() => Array(7).fill(0)) },
        ];

        surveyData.forEach(survey => {
            const indices = [
                survey.q1 - 1, 
                survey.q2 - 1, 
                survey.q3 - 1, 
                survey.q4 - 1
            ];
            
            report.forEach((question, i) => {
                if (indices[i] >= 0 && indices[i] <= 6) {
                    // Assume we are counting answers by gender
                    const genderIndex = survey.gender === 'M' ? 0 : 1; 
                    question.answers[genderIndex][indices[i]]++;
                }
            });
        });

        setFullReport(report);
    };

    const renderReportTable = () => {
        if (!fullReport.length) return null;

        return (
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Question</th>
                        <th>Замечательно</th>
                        <th>Очень хорошо</th>
                        <th>Хорошо</th>
                        <th>Нормально</th>
                        <th>Требует  улучшение</th>
                        <th>Плохо</th>
                        <th>Не знаю</th>
                    </tr>
                </thead>
                <tbody>
                    {fullReport.map((item, index) => (
                        <tr key={index}>
                            <td>{item.question}</td>
                            {item.answers[0].map((count: number, i: number) => (
                                <td key={i}>{count}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="container">
            <h1>Flight Satisfaction Full Report</h1>
            {renderReportTable()}
        </div>
    );
};

export default FullReport;
