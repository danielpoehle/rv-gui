import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '../api/apiClient'; // Unser zentraler API-Client
import { Table, Spinner, Alert, Pagination, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const verkehrsartColorMap = {
  SPFV: 'danger',   // rot
  SPNV: 'success',  // grün
  SGV: 'primary',   // blau
  ALLE: 'dark'      // dunkelgrau
};

function KapazitaetstopfOverviewPage() {
    const [toepfe, setToepfe] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(''); // Für Erfolgs-/Fehlermeldungen nach Aktionen
    
    // State und Logik für die Paginierung
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limitPerPage] = useState(15);
    
    const fetchToepfe = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/kapazitaetstoepfe?page=${currentPage}&limit=${limitPerPage}&sortBy=Kalenderwoche:asc`);
            
            setToepfe(response.data.data);
            setTotalPages(response.data.totalPages);
            setError(null);
        } catch (err) {
            console.error("Fehler beim Laden der Kapazitätstöpfe:", err);
            setError("Fehler beim Laden der Kapazitätstöpfe.");
            setToepfe([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, limitPerPage]); // Abhängigkeiten der Funktion

    useEffect(() => {       

        fetchToepfe();
    }, [fetchToepfe]);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
            setCurrentPage(pageNumber);
        }
    };

    // HANDLER-FUNKTION für das Löschen
    const handleDelete = async (topfId, topfSprechendeId) => {
        // Sicherheitsabfrage für den Benutzer
        if (!window.confirm(`Möchtest du den Kapazitätstopf "${topfSprechendeId}" wirklich endgültig löschen?`)) {
            return;
        }

        try {
            setFeedback(`Lösche Topf ${topfSprechendeId}...`);
            const response = await apiClient.delete(`/kapazitaetstoepfe/${topfId}`);
            setFeedback(response.data.message); // Erfolgsmeldung vom Backend anzeigen
            
            // Lade die Daten auf der aktuellen Seite neu, um die Liste zu aktualisieren
            await fetchToepfe();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Löschen fehlgeschlagen.';
            setError(errorMsg); // Fehler prominent anzeigen
            console.error(err);
        }
    };
    
    // Die intelligente Paginierungslogik (identisch zur Slot-Seite)
    const paginationItems = useMemo(() => {
        const siblingCount = 2;
        const totalPageNumbers = siblingCount + 5;
        if (totalPages <= totalPageNumbers) {
            const items = []; for (let i = 1; i <= totalPages; i++) items.push(i); return items;
        }
        const shouldShowLeftEllipsis = currentPage - siblingCount > 2;
        const shouldShowRightEllipsis = currentPage + siblingCount < totalPages - 1;
        if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
            const items = []; for (let i = 1; i <= 3 + 2 * siblingCount; i++) items.push(i); return [...items, '...', totalPages];
        }
        if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
            const items = []; for (let i = totalPages - (2 + 2 * siblingCount); i <= totalPages; i++) items.push(i); return [1, '...', ...items];
        }
        if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
            const items = []; for (let i = currentPage - siblingCount; i <= currentPage + siblingCount; i++) items.push(i); return [1, '...', ...items, '...', totalPages];
        }
        return [];
    }, [currentPage, totalPages]);


    if (loading) {
        return <div className="text-center mt-5"><Spinner animation="border" style={{ width: '3rem', height: '3rem' }} /></div>;
    }
    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div>
            <div>
                <Link to="/" className="btn btn-secondary mb-4">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Startseite
                </Link>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1><i className="bi bi-box-seam me-3"></i>Kapazitätstöpfe</h1>  
                <Link to="/kapazitaetstoepfe/summary">
                    <Button variant="info">
                        <i className="bi bi-bar-chart-line-fill me-2"></i>Zusammenfassung anzeigen
                    </Button>
                </Link>              
            </div>
            {feedback && <Alert variant="info" onClose={() => setFeedback('')} dismissible>{feedback}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            
            {toepfe.length === 0 && !loading ? (
                <Alert variant="info">Keine Kapazitätstöpfe gefunden.</Alert>
            ) : (
                <>
                    <Table striped bordered hover responsive className="shadow-sm">
                        <thead className="table-dark">
                            <tr>
                                <th>Topf-ID</th>
                                <th>Verkehrsart</th>
                                <th>Rel. KW</th>
                                <th>Verkehrstag / Zeitfenster</th>
                                <th>Anz. Slots</th>
                                <th>(Anfragen / max. Kapa.)</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {toepfe.map(topf => {
                                const isOverbooked = topf.ListeDerAnfragen.length > topf.maxKapazitaet;
                                const canBeDeleted = topf.ListeDerSlots.length === 0 && topf.ListeDerAnfragen.length === 0;
                                return (
                                    <tr key={topf._id}>
                                        <td><code>{topf.TopfID}</code></td>                                        
                                        <td>
                                            <Badge bg={verkehrsartColorMap[topf.Verkehrsart] || 'secondary'}>
                                                {topf.Verkehrsart}
                                            </Badge>
                                        </td>
                                        <td>{topf.Kalenderwoche}</td>
                                        <td>{topf.Verkehrstag} / {topf.Zeitfenster}</td>                                        
                                        <td>{topf.ListeDerSlots.length}</td>
                                        <td className={isOverbooked ? 'text-danger fw-bold' : ''}>
                                            {topf.ListeDerAnfragen.length} / {topf.maxKapazitaet}
                                            {isOverbooked && <i className="bi bi-exclamation-triangle-fill ms-2" title="Kapazität überschritten"></i>}
                                        </td>
                                        <td className="align-middle">
                                            <Link to={`/kapazitaetstoepfe/${topf._id}`}>
                                                <Button variant="outline-primary" size="sm" title="Details anzeigen">
                                                    <i className="bi bi-search"></i>
                                                </Button>
                                            </Link>
                                            {canBeDeleted && (
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    title="Kapazitätstopf löschen"
                                                    onClick={() => handleDelete(topf._id, topf.TopfID)}
                                                    className="ms-1"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                                {paginationItems.map((item, index) =>
                                    typeof item === 'string' ? (
                                        <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />
                                    ) : (
                                        <Pagination.Item key={item} active={item === currentPage} onClick={() => handlePageChange(item)}>
                                            {item}
                                        </Pagination.Item>
                                    )
                                )}
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

export default KapazitaetstopfOverviewPage;