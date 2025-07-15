import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient'; // <-- NEUER IMPORT
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Pagination from 'react-bootstrap/Pagination';

function SlotOverviewPage() {
    // State-Variablen zum Speichern der Daten, des Ladezustands und von Fehlern
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true); // Startet mit true, da wir direkt laden wollen
    const [error, setError] = useState(null);

    // STATE-VARIABLEN für Paginierung
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limitPerPage] = useState(12); // Wie viele Einträge pro Seite


    // useEffect wird jetzt bei Änderungen von `currentPage` neu ausgeführt
    useEffect(() => {
        const fetchSlots = async () => {
            setLoading(true); // Bei jedem neuen Laden (auch Seitenwechsel) den Spinner anzeigen
            try {
                // Sende die aktuelle Seite und das Limit als Query-Parameter an die API
                const response = await apiClient.get(`/slots?page=${currentPage}&limit=${limitPerPage}`);
                
                setSlots(response.data.data);
                setTotalPages(response.data.totalPages); // Speichere die Gesamtanzahl der Seiten
                setError(null);
            } catch (err) {
                console.error("Fehler beim Laden der Slots:", err);
                setError("Fehler beim Laden der Slots. Bitte stelle sicher, dass der Backend-Server läuft.");
                setSlots([]);
                setTotalPages(0);
            } finally {
                setLoading(false);
            }
        };

        fetchSlots();
    }, [currentPage, limitPerPage]); // Abhängigkeits-Array: Führe den Effekt neu aus, wenn sich die Seite oder das Limit ändert.


    // Helferfunktion zum Formatieren der Zeit
    const formatTime = (zeitObjekt) => {
        if (!zeitObjekt) return '';
        const stunde = String(zeitObjekt.stunde).padStart(2, '0');
        const minute = String(zeitObjekt.minute).padStart(2, '0');
        return `${stunde}:${minute}`;
    };

    // Handler-Funktion, die aufgerufen wird, wenn eine neue Seite angeklickt wird
    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return; // Ungültige Seiten verhindern
        setCurrentPage(pageNumber);
    };

    // LOGIK ZUR GENERIERUNG DER SEITENZAHLEN
    // useMemo sorgt dafür, dass diese Berechnung nur neu ausgeführt wird, wenn sich
    // currentPage oder totalPages ändern, was die Performance verbessert.
    const paginationItems = useMemo(() => {
        const siblingCount = 2; // Wie viele Nachbarn links und rechts von der aktuellen Seite
        const totalPageNumbers = siblingCount + 5; // current + 2*siblings + first + last + 2*ellipsis

        // Fall 1: Weniger Seiten als wir anzeigen wollen -> zeige alle
        if (totalPages <= totalPageNumbers) {
            const items = [];
            for (let i = 1; i <= totalPages; i++) items.push(i);
            return items;
        }

        const shouldShowLeftEllipsis = currentPage - siblingCount > 2;
        const shouldShowRightEllipsis = currentPage + siblingCount < totalPages - 1;

        // Fall 2: Nur rechte Ellipse anzeigen (wir sind am Anfang)
        if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
            const items = [];
            for (let i = 1; i <= 3 + 2 * siblingCount; i++) items.push(i);
            return [...items, '...', totalPages];
        }
        
        // Fall 3: Nur linke Ellipse anzeigen (wir sind am Ende)
        if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
            const items = [];
            for (let i = totalPages - (2 + 2 * siblingCount); i <= totalPages; i++) items.push(i);
            return [1, '...', ...items];
        }

        // Fall 4: Beide Ellipsen anzeigen (wir sind in der Mitte)
        if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
            const items = [];
            for (let i = currentPage - siblingCount; i <= currentPage + siblingCount; i++) items.push(i);
            return [1, '...', ...items, '...', totalPages];
        }

        return []; // Fallback
    }, [currentPage, totalPages]);

    // Rendere einen Lade-Spinner, während die Daten geholt werden
    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Lade Slots...</span>
                </Spinner>
                <p>Lade Slots...</p>
            </div>
        );
    }

    // Rendere eine Fehlermeldung, falls ein Fehler aufgetreten ist
    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    // Rendere die Tabelle, wenn das Laden abgeschlossen und fehlerfrei ist
    return (
        <div>
            <div>
                <Link to="/" className="btn btn-secondary mb-4">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Startseite
                </Link>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1><i className="bi bi-calendar3-range me-3"></i>Slot-Übersicht</h1>
                <div> {/* Wrapper für mehrere Buttons */}
                    <Link to="/slots/summary" className="me-2">
                        <Button variant="info">
                            <i className="bi bi-bar-chart-line-fill me-2"></i>Zusammenfassung Slots nach Linien
                        </Button>
                    </Link>
                    <Link to="/slots/counter" className="me-2">
                        <Button variant="dark">
                            <i className="bi bi-clipboard2-data me-2"></i>Slot-Inventar
                        </Button>
                    </Link>
                    <Link to="/slots/neu">
                        <Button variant="success">
                            <i className="bi bi-plus-lg me-2"></i>Slots in Serie anlegen
                        </Button>
                    </Link>
                </div>
            </div>
            
            {/* Bedingtes Rendern: Zeige Lade-Spinner, Fehlermeldung oder die Tabelle */}

            {loading ? (
                <div className="text-center mt-5">
                    <Spinner animation="border" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Lade Slots...</span>
                    </Spinner>
                    <p className="mt-2">Lade Slots...</p>
                </div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : slots.length === 0 ? (
                <Alert variant="info">Keine Slots gefunden. Du kannst über den Button oben neue Slots anlegen.</Alert>
            ) : (
                <>
                    <Table striped bordered hover responsive className="shadow-sm">
                        <thead className="table-dark">
                            <tr>                                
                                <th>Sprechende ID</th>
                                <th>Linie</th>
                                <th>Abschnitt</th>
                                <th>Von</th>
                                <th>Bis</th>
                                <th>Verkehrstag</th>
                                <th>Rel. KW</th>
                                <th>Abfahrt</th>
                                <th>Ankunft</th>
                                <th>Grundentgelt</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map(slot => (
                                <tr key={slot._id}>                                    
                                    <td><code>{slot.SlotID_Sprechend}</code></td>
                                    <td>{slot.Linienbezeichnung || '-'}</td>
                                    <td>{slot.Abschnitt}</td>
                                    <td>{slot.von}</td>
                                    <td>{slot.bis}</td>
                                    <td>{slot.Verkehrstag}</td>
                                    <td>{slot.Kalenderwoche}</td>
                                    <td>{formatTime(slot.Abfahrt)}</td>
                                    <td>{formatTime(slot.Ankunft)}</td>
                                    <td className="text-end">{slot.Grundentgelt ? slot.Grundentgelt.toFixed(2) : '0.00'} €</td>
                                    <td>
                                        <Link to={`/slots/${slot._id}`}>
                                            <Button variant="outline-primary" size="sm" title="Details anzeigen">
                                                <i className="bi bi-search"></i>
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {/* Paginierungs-Steuerung, wird nur angezeigt, wenn es mehr als eine Seite gibt */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                                
                                {/* NEUES RENDERING DER SEITENZAHLEN */}
                                {paginationItems.map((item, index) => {
                                    if (typeof item === 'string') {
                                        // item ist '...'
                                        return <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />;
                                    }
                                    return (
                                        <Pagination.Item 
                                            key={item} 
                                            active={item === currentPage} 
                                            onClick={() => handlePageChange(item)}
                                        >
                                            {item}
                                        </Pagination.Item>
                                    );
                                })}

                                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default SlotOverviewPage;