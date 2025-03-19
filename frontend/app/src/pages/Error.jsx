import Container from "react-bootstrap/Container";

export default function Error() {
    return (
        <div id="error-page" style={{ textAlign: "center" }}>
            <Container fluid className="p-3">
                <Container
                    className="p-5 mb-4 rounded-3"
                    style={{
                        backgroundColor: "rgba(13, 81, 79, 0.5)",
                    }}
                >
                    <h1>Oops!</h1>
                    <p>Sorry, an unexpected error has occurred.</p>
                    <p>Page don't exist.</p>
                </Container>
            </Container>
        </div>
    );
}
