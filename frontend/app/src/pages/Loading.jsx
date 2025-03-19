import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";

export default function Loading() {
    return (
        <Container fluid className="p-3">
            <Container
                className="p-5 mb-4 rounded-3 text-center"
                style={{
                    backgroundColor: "transparent",
                }}
            >
                {/* added style 5rem because size="sm" only */}
                <Spinner style={{ width: "5rem", height: "5rem" }}/> 
            </Container>
        </Container>
    );
}
