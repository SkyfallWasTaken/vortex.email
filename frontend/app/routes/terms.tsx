import { Link } from "react-router";

const lastUpdated = "April 8, 2025";

export function meta() {
	return [
		{ title: "Terms of Service - Vortex" },
		{
			name: "description",
			content: `View the Terms of Service for Vortex, a free, disposable email address service.\nLast updated on ${lastUpdated}.`,
		},
	];
}

export default function Terms() {
	return (
		<div className="flex flex-col md:p-6 mx-6 my-6 prose">
			<h1 id="terms-of-service-for-vortex" className="mb-0">
				Terms of Service for Vortex
			</h1>
			<p className="text-text/80">You need to read this before using Vortex.</p>

			<p>
				<strong>Last Updated: {lastUpdated}</strong>
			</p>
			<h2 id="1-introduction">1. Introduction</h2>
			<p>
				Welcome to Vortex ("we," "our," "us," "the Service," or "Vortex"), a
				temporary email service available at vortex.skyfall.dev. Please read
				these Terms of Service ("Terms") carefully before using our Service.
			</p>
			<p>
				By accessing or using Vortex, you agree to be bound by these Terms. If
				you disagree with any part of the terms, you may not access the Service.
			</p>
			<h2 id="2-definitions">2. Definitions</h2>
			<ul>
				<li>
					"Service" refers to the Vortex temporary email service accessible at
					vortex.skyfall.dev.
				</li>
				<li>
					"User," "you," and "your" refers to the individual accessing or using
					the Service.
				</li>
				<li>
					"Content" refers to all emails, attachments, and other materials
					transmitted through or stored on the Service.
				</li>
				<li>
					"Temporary Email Address" refers to any email address created through
					the Service.
				</li>
			</ul>
			<h2 id="3-account-creation-and-eligibility">
				3. Account Creation and Eligibility
			</h2>
			<p>
				3.1 No registration is required to use our Service. Users can create
				temporary email addresses immediately.
			</p>
			<p>
				3.2 By using the Service, you represent that you are at least 13 years
				of age.
			</p>
			<p>
				3.3 If you are under the age of 18, you represent that you have your
				parent's or legal guardian's permission to use the Service.
			</p>
			<h2 id="4-service-description">4. Service Description</h2>
			<p>
				4.1 Vortex provides users with temporary email addresses that can
				receive emails only. The Service does not allow users to send emails.
			</p>
			<p>
				4.2 Emails received through our Service are stored indefinitely until
				manually deleted by the user.
			</p>
			<p>
				4.3 Access to emails requires knowledge of the randomly generated email
				username and domain.
			</p>
			<h2 id="5-acceptable-use">5. Acceptable Use</h2>
			<p>
				5.1 You agree to use the Service only for lawful purposes and in
				accordance with these Terms.
			</p>
			<p>5.2 You agree not to use the Service:</p>
			<ul>
				<li>
					In any way that violates any applicable local, national, or
					international law or regulation.
				</li>
				<li>
					To impersonate or attempt to impersonate Vortex, a Vortex employee,
					another user, or any other person or entity.
				</li>
				<li>
					To engage in any other conduct that restricts or inhibits anyone's use
					or enjoyment of the Service, or which may harm Vortex or users of the
					Service.
				</li>
				<li>
					For any harmful, fraudulent, deceptive, threatening, harassing,
					defamatory, obscene, or otherwise objectionable purpose.
				</li>
				<li>
					To create an excessive number of temporary email addresses (e.g.,
					creating 1000+ addresses) that could negatively impact service
					performance.
				</li>
			</ul>
			<p>5.3 You agree not to use the Service for receiving:</p>
			<ul>
				<li>
					Content that infringes upon any patent, trademark, trade secret,
					copyright, or other intellectual property rights of any party.
				</li>
				<li>
					Content that contains software viruses or any other computer code
					designed to interrupt, destroy, or limit the functionality of any
					computer software or hardware.
				</li>
			</ul>
			<h2 id="6-intellectual-property">6. Intellectual Property</h2>
			<p>
				6.1 The Service and its original content (excluding Content submitted by
				users), features, and functionality are and will remain the exclusive
				property of Vortex and its licensors.
			</p>
			<p>
				6.2 The Service is protected by copyright, trademark, and other laws of
				both the United Kingdom and foreign countries.
			</p>
			<h2 id="7-content-ownership">7. Content Ownership</h2>
			<p>
				7.1 You retain any and all of your rights to any Content you receive on
				or through the Service.
			</p>
			<p>
				7.2 By using the Service, you grant us a worldwide, non-exclusive,
				royalty-free license to use, copy, reproduce, process, adapt, modify,
				publish, transmit, and display such Content for the purpose of providing
				the Service.
			</p>
			<h2 id="8-privacy">8. Privacy</h2>
			<p>
				8.1 Our Privacy Policy, available at{" "}
				<Link to="/privacy">vortex.skyfall.dev/privacy</Link>, describes how we
				handle the information you provide to us when you use our Service. By
				using Vortex, you agree to our collection and use of information in
				accordance with the Privacy Policy.
			</p>
			<h2 id="9-termination">9. Termination</h2>
			<p>
				9.1 We may terminate or suspend your access to the Service immediately,
				without prior notice or liability, for any reason whatsoever, including
				without limitation if you breach the Terms.
			</p>
			<p>
				9.2 We reserve the right to disable any temporary email address at any
				time for any reason.
			</p>
			<p>
				9.3 All provisions of the Terms which by their nature should survive
				termination shall survive termination, including, without limitation,
				ownership provisions, warranty disclaimers, indemnity, and limitations
				of liability.
			</p>
			<h2 id="10-limitation-of-liability">10. Limitation of Liability</h2>
			<p>
				10.1 In no event shall Vortex, nor its directors, employees, partners,
				agents, suppliers, or affiliates, be liable for any indirect,
				incidental, special, consequential or punitive damages, including
				without limitation, loss of profits, data, use, goodwill, or other
				intangible losses, resulting from:
			</p>
			<ul>
				<li>
					Your access to or use of or inability to access or use the Service.
				</li>
				<li>Any conduct or content of any third party on the Service.</li>
				<li>Any content obtained from the Service.</li>
				<li>
					Unauthorized access, use, or alteration of your transmissions or
					content.
				</li>
				<li>
					Any service disruptions, maintenance periods, or technical failures.
				</li>
				<li>
					Any links, content, or services provided by third parties that may be
					contained in emails received through the Service.
				</li>
			</ul>
			<p>
				10.2 We are not responsible for any content received through emails on
				our Service or any actions taken by third parties based on emails
				received through our Service.
			</p>
			<p>
				10.3 The limitations of liability set forth in this section shall apply
				to the fullest extent permitted by law in the applicable jurisdiction.
			</p>
			<h2 id="11-disclaimer">11. Disclaimer</h2>
			<p>
				11.1 Your use of the Service is at your sole risk. The Service is
				provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided
				without warranties of any kind, whether express or implied.
			</p>
			<p>11.2 Vortex does not warrant that:</p>
			<ul>
				<li>The Service will meet your specific requirements.</li>
				<li>
					The Service will be uninterrupted, timely, secure, or error-free.
				</li>
				<li>
					The results that may be obtained from the use of the Service will be
					accurate or reliable.
				</li>
			</ul>
			<p>
				11.3 We do not guarantee the security or confidentiality of information
				provided to or stored in the Service.
			</p>
			<p>
				11.4 You acknowledge and understand the inherent risks of using a
				temporary email service, including but not limited to potential exposure
				to unwanted content, phishing attempts, or malicious attachments.
			</p>
			<h2 id="12-changes-to-terms">12. Changes to Terms</h2>
			<p>
				12.1 We reserve the right, at our sole discretion, to modify or replace
				these Terms at any time.
			</p>
			<p>
				12.2 By continuing to access or use our Service after those revisions
				become effective, you agree to be bound by the revised terms. If you do
				not agree to the new terms, please stop using the Service.
			</p>
			<h2 id="13-indemnification">13. Indemnification</h2>
			<p>
				13.1 You agree to defend, indemnify, and hold harmless Vortex and its
				licensee and licensors, and their employees, contractors, agents,
				officers, and directors, from and against any and all claims, damages,
				obligations, losses, liabilities, costs or debt, and expenses (including
				but not limited to attorney's fees), resulting from or arising out of:
			</p>
			<ul>
				<li>Your use and access of the Service.</li>
				<li>Your violation of any term of these Terms.</li>
				<li>
					Your violation of any third-party right, including without limitation
					any copyright, property, or privacy right.
				</li>
				<li>Any claim that your Content caused damage to a third party.</li>
			</ul>
			<h2 id="14-governing-law">14. Governing Law</h2>
			<p>
				14.1 These Terms shall be governed and construed in accordance with the
				laws of England and Wales, without regard to its conflict of law
				provisions.
			</p>
			<p>
				14.2 Our failure to enforce any right or provision of these Terms will
				not be considered a waiver of those rights.
			</p>
			<p>
				14.3 Any legal suit, action, or proceeding arising out of, or related
				to, these Terms or the Service shall be instituted exclusively in the
				courts of England and Wales.
			</p>
			<h2 id="15-class-action-waiver">15. Class Action Waiver</h2>
			<p>
				15.1 You agree to waive any right to participate in a class action
				lawsuit or a class-wide arbitration against Vortex or its affiliates.
			</p>
			<h2 id="16-force-majeure">16. Force Majeure</h2>
			<p>
				16.1 Vortex shall not be liable for any failure to perform its
				obligations under these Terms where such failure results from any cause
				beyond our reasonable control, including, but not limited to,
				mechanical, electronic, or communications failure or degradation, acts
				of God, terrorist attacks, or government actions.
			</p>
			<h2 id="17-spam-and-malicious-content-filtering">
				17. Spam and Malicious Content Filtering
			</h2>
			<p>
				17.1 We reserve the right to filter, block, or otherwise prevent the
				delivery of spam, malicious content, or other harmful materials to
				temporary email addresses provided by our Service.
			</p>
			<h2 id="18-reports-of-abuse">18. Reports of Abuse</h2>
			<p>
				18.1 If you wish to report any abuse of our Service, please contact us
				at <a href="mailto:hi@skyfall.dev">hi@skyfall.dev</a>.
			</p>
			<h2 id="19-legal-compliance-and-required-disclosures">
				19. Legal Compliance and Required Disclosures
			</h2>
			<p>
				19.1 We may access, preserve, and disclose information if we have a good
				faith belief that it is necessary to:
			</p>
			<ul>
				<li>
					Comply with applicable laws, regulations, legal processes, or
					governmental requests.
				</li>
				<li>
					Enforce these Terms, including investigation of potential violations.
				</li>
				<li>
					Detect, prevent, or otherwise address fraud, security, or technical
					issues.
				</li>
				<li>
					Protect against harm to the rights, property, or safety of Vortex, our
					users, or the public as required or permitted by law.
				</li>
			</ul>
			<h2 id="20-feedback">20. Feedback</h2>
			<p>
				20.1 If you provide Vortex with any feedback, suggestions, improvements,
				or feature requests ("Feedback"), you hereby grant Vortex a perpetual,
				irrevocable, worldwide, royalty-free license to use, reproduce, display,
				distribute, and create derivative works based upon such Feedback in
				connection with the Service and other Vortex products and services.
			</p>
			<h2 id="21-use-of-anonymized-data">21. Use of Anonymized Data</h2>
			<p>
				21.1 You agree that we may collect and use anonymized and aggregated
				data derived from your use of the Service for the purposes of improving
				our Service, creating analytics, and for other legitimate business
				purposes.
			</p>
			<h2 id="22-export-control">22. Export Control</h2>
			<p>
				22.1 You agree to comply with all applicable import, re-import, export,
				and re-export control laws and regulations, including the Export
				Administration Regulations maintained by the U.S. Department of
				Commerce, trade and economic sanctions maintained by the Treasury
				Department's Office of Foreign Assets Control, and the International
				Traffic in Arms Regulations.
			</p>
			<p>
				22.2 You warrant that you are not located in a country that is subject
				to a U.S. Government embargo, or that has been designated by the U.S.
				Government as a "terrorist supporting" country, and that you are not
				listed on any U.S. Government restricted parties lists.
			</p>
			<h2 id="23-transfer-of-rights">23. Transfer of Rights</h2>
			<p>
				23.1 In the event of a merger, acquisition, or sale of all or a portion
				of our assets, user information may be transferred as part of the
				transaction. These Terms will continue to apply to your information as
				transferred to the new entity.
			</p>
			<h2 id="24-severability">24. Severability</h2>
			<p>
				24.1 If any provision of these Terms is found to be unenforceable or
				invalid under any applicable law, such unenforceability or invalidity
				shall not render these Terms unenforceable or invalid as a whole, and
				such provisions shall be deleted without affecting the remaining
				provisions herein.
			</p>
			<h2 id="25-entire-agreement">25. Entire Agreement</h2>
			<p>
				25.1 These Terms constitute the entire agreement between you and Vortex
				regarding our Service, and supersede and replace any prior agreements we
				might have between us regarding the Service.
			</p>
			<h2 id="26-contact-us">26. Contact Us</h2>
			<p>
				26.1 If you have any questions about these Terms, please contact us:
			</p>
			<ul>
				<li>
					<b>By email (highly preferred):</b>{" "}
					<a href="mailto:hi@skyfall.dev">hi@skyfall.dev</a>
				</li>
				<li>
					<b>By mail:</b>
					<br />
					Mahad Kalam
					<br />
					27 Old Gloucester Street
					<br />
					London
					<br />
					WC1N 3AX
					<br />
					United Kingdom
				</li>
			</ul>
		</div>
	);
}
