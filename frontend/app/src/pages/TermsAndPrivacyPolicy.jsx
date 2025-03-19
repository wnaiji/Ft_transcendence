import React from "react";
import { Container, Row, Col } from "react-bootstrap";

export default function TermsAndPrivacyPolicy() {
	return (
		<Container fluid className="p-3">
			<Container
				className="p-5 mb-4 rounded-3"
				style={{
					backgroundColor: "rgba(13, 81, 79, 0.5)",
					height: "80vh", // Full viewport height
					overflowY: "auto", // Enable vertical scrolling
				}}
			>
				<Row
					style={{
						color: "#eef7ff",
					}}
				>
					<Col>
						<h1 className="mb-4">
							Terms of Service & Privacy Policy
						</h1>

						<section>
							<h2>Terms of Service</h2>
							<p>
								By using our website, you agree to the following
								terms and conditions. Please read them carefully
								before proceeding.
							</p>
							<p>
								<strong>Use of Services:</strong> You agree to
								use our services only for lawful purposes and in
								compliance with all applicable laws and
								regulations.
							</p>
							<p>
								<strong>Intellectual Property:</strong> All
								content on this site, including text, images,
								and logos, is owned by us and protected by
								copyright laws. You may not reproduce or
								distribute any content without prior permission.
							</p>
							<p>
								<strong>Limitation of Liability:</strong> We are
								not responsible for any damages resulting from
								the use of our website or services.
							</p>
						</section>

						<hr />

						<section>
							<h2>Privacy Policy</h2>
							<p>
								We value your privacy and are committed to
								protecting your personal data. This policy
								explains how we collect, use, and safeguard your
								information.
							</p>
							<p>
								<strong>What Data We Collect:</strong> We may
								collect personal information such as your name,
								email address, and usage data when you use our
								website.
							</p>
							<p>
								<strong>How We Use Your Data:</strong> Your data
								is used to provide our services, improve user
								experience, and comply with legal obligations.
							</p>
							<p>
								<strong>Your Rights:</strong> You have the right
								to access, modify, or delete your personal data
								at any time. Please contact us if you wish to
								exercise these rights.
							</p>
						</section>

						<hr />

						<section>
							<h2>Contact Us</h2>
							<p>
								If you have any questions about our Privacy
								Policy or Terms of Service, please contact us
								at:
							</p>
							<ul>
								<li>Email: support@support.com</li>
								<li>Phone: +06 23 23 23 23</li>
								<li>
									Address: 61 Av. Simone Veil, 06200 Nice
								</li>
							</ul>
						</section>
					</Col>
				</Row>
			</Container>
		</Container>
	);
}
