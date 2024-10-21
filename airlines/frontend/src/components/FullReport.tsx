import React, { useEffect, useState } from 'react';
import '../index.css'; // Подключаем файл с кастомными стилями

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
            { question: 'Оцените наш самолет', answers: Array(6).fill(0).map(() => Array(7).fill(0)) },
            { question: 'Как бы вы оценили наших бортпроводников?', answers: Array(6).fill(0).map(() => Array(7).fill(0)) },
            { question: 'Как бы вы оценили нашу систему развлечений на борту?', answers: Array(6).fill(0).map(() => Array(7).fill(0)) },
            { question: 'Оцените цену билета', answers: Array(6).fill(0).map(() => Array(7).fill(0)) },
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
            <table className="full-report__table">
                <thead>
                    <tr className="full-report__header-row">
                        <th className="full-report__header-cell">Вопрос</th>
                        <th className="full-report__header-cell">Замечательно</th>
                        <th className="full-report__header-cell">Очень хорошо</th>
                        <th className="full-report__header-cell">Хорошо</th>
                        <th className="full-report__header-cell">Нормально</th>
                        <th className="full-report__header-cell">Требует улучшение</th>
                        <th className="full-report__header-cell">Плохо</th>
                        <th className="full-report__header-cell">Не знаю</th>
                    </tr>
                </thead>
                <tbody>
                    {fullReport.map((item, index) => (
                        <tr key={index} className="full-report__row">
                            <td className="full-report__cell">{item.question}</td>
                            {item.answers[0].map((count: number, i: number) => (
                                <td key={i} className="full-report__cell">{count}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="full-report">
            <h1 className="full-report__title">Полный отчет об удовлетворенности полетом</h1>
            {renderReportTable()}
        </div>
    );
};

export default FullReport;